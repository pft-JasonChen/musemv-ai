#!/usr/bin/env python3
"""Read eBugs from ePF over the REST API.

Four endpoints make up one complete ticket; see API.md. This script encodes the
endpoint quirks once (they are NOT all in the vendor docs -- the `terms` operator
is broken, comment rows use `Comment` not `Content`, and EbugSearch disagrees with
GetKernel about who the handler is) so callers do not have to re-remember them.

Read-only: nothing here writes to ePF. Python 3 stdlib only, no pip deps.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "https://eperfect.perfectcorp.com"
TOKEN_PAGE = "https://eperfect.perfectcorp.com/sso/mgm/tokenPage"
TIMEOUT = 60

# --- product defaults -------------------------------------------------------
YCM_WEB_PRODUCT_ID = 315          # "YouCam Muse Web"
PM_OPEN_STATUSES = ["NewCreated", "Assigned"]


# --- token ------------------------------------------------------------------

class NoToken(Exception):
    pass


def _read_env_file(path):
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        if key.strip() == "EPF_API_TOKEN":
            return value.strip().strip("'\"") or None
    return None


def _repo_root():
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / ".git").exists():
            return parent
    return None


def resolve_token():
    """env var -> repo-root .env -> web-app/.env.local -> ~/.config/ycm-ebug/.env"""
    from_env = os.environ.get("EPF_API_TOKEN", "").strip()
    if from_env:
        return from_env
    root = _repo_root()
    candidates = [Path.home() / ".config" / "ycm-ebug" / ".env"]
    if root is not None:
        candidates[:0] = [root / ".env", root / "web-app" / ".env.local"]
    for candidate in candidates:
        token = _read_env_file(candidate)
        if token:
            return token
    env_path = (root / ".env") if root is not None \
        else "the repo root as .env (run this from inside the checkout)"
    raise NoToken(
        "No ePF API token found.\n\n"
        "This skill reads eBugs with your own ePF REST API Bearer token; there is no\n"
        "shared or built-in credential. To get one:\n\n"
        f"  1. Apply for a token at {TOKEN_PAGE}\n"
        f"  2. Save it as EPF_API_TOKEN=<token> in {env_path}\n"
        "     (that path is gitignored -- see .env.example for the shape)\n\n"
        "Or export EPF_API_TOKEN in your shell for a one-off run.\n"
        "Do not proceed by scraping the ePF web UI instead."
    )


# --- HTTP -------------------------------------------------------------------

def _curl(url, token, data=None):
    """Transport is curl, not urllib, on purpose.

    urllib verifies against Python's own CA bundle, and a stock python.org build
    on macOS ships without one (no certifi, no cert.pem) -- every ePF call then
    dies with "self-signed certificate in certificate chain" even though the chain
    is a perfectly ordinary DigiCert one. curl uses the OS trust store, is present
    on macOS/Linux/Windows 10+, and needs no pip install. The token goes in a
    config file read from stdin (`-K -`) so it never lands in argv, where any
    other user on the box could read it out of `ps`.
    """
    out_fd, out_path = tempfile.mkstemp(prefix="epf_resp_")
    os.close(out_fd)
    body_path = None
    try:
        cmd = ["curl", "-sS", "-K", "-", "--max-time", str(TIMEOUT),
               "-o", out_path, "-w", "%{http_code}\t%{content_type}"]
        if data is not None:
            body_fd, body_path = tempfile.mkstemp(prefix="epf_body_")
            with os.fdopen(body_fd, "wb") as fh:
                fh.write(json.dumps(data).encode("utf-8"))
            cmd += ["-H", "Content-Type: application/json",
                    "--data-binary", "@" + body_path]
        cmd.append(url)
        proc = subprocess.run(
            cmd, input=f'header = "Authorization: Bearer {token}"\n'.encode("utf-8"),
            capture_output=True,
        )
        if proc.returncode != 0:
            raise SystemExit(
                f"curl failed ({proc.returncode}) on {url}\n"
                f"{proc.stderr.decode('utf-8', 'replace').strip()}\n"
                "If this is a TLS or DNS error, check you are on the corporate network/VPN."
            )
        status, _, ctype = proc.stdout.decode("utf-8", "replace").partition("\t")
        payload = Path(out_path).read_bytes()
        return int(status.strip() or 0), payload, ctype.strip()
    finally:
        for path in (out_path, body_path):
            if path:
                try:
                    os.unlink(path)
                except OSError:
                    pass


def _urllib(url, token, data=None):
    """Fallback for a box with no curl but a working Python CA bundle."""
    headers = {"Authorization": f"Bearer {token}"}
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status, resp.read(), resp.headers.get("Content-Type", "")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read(), ""
    except urllib.error.URLError as exc:
        raise SystemExit(f"Cannot reach ePF ({exc.reason}). On the network/VPN?") from None


def _request(url, token, data=None, raw=False):
    try:
        status, payload, ctype = _curl(url, token, data)
    except FileNotFoundError:
        status, payload, ctype = _urllib(url, token, data)
    if status >= 400:
        detail = payload[:500].decode("utf-8", "replace")
        hint = ""
        if status in (401, 403):
            hint = (f"\nThe token was rejected. Apply for your own at {TOKEN_PAGE} "
                    "and update EPF_API_TOKEN.")
        raise SystemExit(f"ePF {status} on {url}\n{detail}{hint}")
    if raw:
        return payload, ctype
    try:
        parsed = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise SystemExit(
            f"ePF returned non-JSON from {url} (likely an SSO login page -- the "
            "Bearer token does not work on browser/OIDC endpoints)."
        ) from None
    # Public Query returns {total, results} on success and {status:"fail"} on error;
    # there is no `status` key on the happy path, so only an explicit fail is one.
    if isinstance(parsed, dict) and parsed.get("status") == "fail":
        raise SystemExit(f"ePF query failed: {parsed.get('message')}")
    return parsed


def public_query(token, model, conditions, page_size=100, sort_by="CreateTime",
                 is_desc=True, max_pages=50):
    """Paged POST to /IF3/tsr/api/Public/Query/<model>. Conditions are ANDed."""
    if not conditions:
        raise SystemExit(
            f"{model} needs at least one condition -- an empty query times out "
            "server-side rather than returning everything."
        )
    url = f"{BASE}/IF3/tsr/api/Public/Query/{model}"
    rows, page = [], 1
    while page <= max_pages:
        payload = _request(url, token, {
            "queryModel": model,
            "conditions": conditions,
            "pageIndex": page,
            "pageSize": page_size,
            "sortBy": sort_by,
            "isDesc": is_desc,
        })
        batch = payload.get("results") or []
        rows.extend(batch)
        total = payload.get("total", len(rows))
        if not batch or len(rows) >= total:
            break
        page += 1
    return rows


def get_kernel(token, bug_code):
    url = f"{BASE}/IF3/ebug/BPM/GetKernel?FormCode={urllib.parse.quote(bug_code)}"
    return _request(url, token)


def download_object(token, object_key):
    """objectKey only (e.g. iForm/2026/09/15/xxx.jpg) -- a full fileURL 500s here."""
    url = f"{BASE}/IF3/ebug/Data/DownloadByToken?o={urllib.parse.quote(object_key)}"
    return _request(url, token, raw=True)


# --- parsing ----------------------------------------------------------------

_LABELS = [
    ("repro_steps", r"Repro(?:duce)?\s*Steps?|Steps?\s*to\s*Reproduce"),
    ("expect_result", r"Expect(?:ed)?\s*Results?"),
    ("result", r"Results?"),
    ("note", r"Notes?"),
]
# Longest-first so "Expect Result:" never gets eaten by the "Result:" branch.
_LABEL_RE = re.compile(
    r"(?im)^[ \t>*-]*(" + "|".join(p for _, p in _LABELS) + r")[ \t]*[:：]"
)


def parse_describe_issue(text):
    """Split DescribeIssue into its four labelled sections.

    The whole report is one free-text blob; the labels are a convention, not a
    schema, so anything before the first label is kept under `preamble` rather
    than dropped.
    """
    out = {"repro_steps": "", "result": "", "expect_result": "", "note": "",
           "preamble": "", "raw": text or ""}
    if not text:
        return out
    matches = list(_LABEL_RE.finditer(text))
    if not matches:
        out["preamble"] = text.strip()
        return out
    if matches[0].start() > 0:
        out["preamble"] = text[:matches[0].start()].strip()
    for i, m in enumerate(matches):
        label = m.group(1).lower()
        key = next(
            (k for k, pat in _LABELS if re.fullmatch(pat, m.group(1), re.I)),
            None,
        )
        if key is None:  # pragma: no cover - alternation covers every branch
            continue
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        chunk = text[m.end():end].strip()
        out[key] = (out[key] + "\n" + chunk).strip() if out[key] else chunk
        del label
    return out


_VERSION_RE = re.compile(r"(\d+(?:\.\d+)+)\s*$")


def version_from_template(template_name):
    """EbugSearch returns no Version field; the version is the tail of TemplateName."""
    if not template_name:
        return None
    m = _VERSION_RE.search(template_name.strip())
    return m.group(1) if m else None


def dedupe_comments(rows):
    """ePF stores genuine duplicate comment rows (same author+text, seconds apart)."""
    seen, out = set(), []
    for row in rows:
        key = (row.get("Creator"), (row.get("Comment") or "").strip())
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


# --- composite reads --------------------------------------------------------

def search(token, conditions=None, product_id=None, bug_belong=None, statuses=None,
           handler=None, assignee=None, creator=None, since=None, page_size=100):
    """One query per status, then dedupe -- `terms` (IN) is broken on this endpoint."""
    base = list(conditions or [])
    if product_id is not None:
        base.append({"field": "ProductID", "term": {"query": str(product_id)}})
    if bug_belong:
        base.append({"field": "BugBelong", "term": {"query": bug_belong}})
    if handler:
        base.append({"field": "Handler", "term": {"query": handler}})
    if assignee:
        base.append({"field": "Assignee", "term": {"query": assignee}})
    if creator:
        base.append({"field": "Creator", "term": {"query": creator}})
    if since:
        base.append({"field": "CreateTime", "range": {"gte": since}})

    status_list = list(statuses or [])
    passes = [base + [{"field": "Status", "term": {"query": s}}] for s in status_list] \
        or [base]

    merged = {}
    for conds in passes:
        for row in public_query(token, "TSR.EbugSearch", conds, page_size=page_size):
            merged.setdefault(row.get("BugCode"), row)
    rows = list(merged.values())
    # Sort globally after the union; per-pass order only sorts within one status.
    rows.sort(key=lambda r: r.get("CreateTime") or "", reverse=True)
    for row in rows:
        row["_Version"] = version_from_template(row.get("TemplateName"))
    return rows


def comments(token, bug_code):
    rows = public_query(
        token, "TSR.EbugComments",
        [{"field": "BugCode", "term": {"query": bug_code}}],
        sort_by="CreateTime", is_desc=False,
    )
    return dedupe_comments(rows)


def full(token, bug_code, with_comments=True):
    """GetKernel for the text, EbugSearch to correct the people/status fields."""
    kernel = get_kernel(token, bug_code)
    form = kernel.get("FormData") or {}
    header = kernel.get("FormHeader") or {}

    hits = public_query(
        token, "TSR.EbugSearch",
        [{"field": "BugCode", "term": {"query": bug_code}}], page_size=5,
    )
    meta = next((h for h in hits if h.get("BugCode") == bug_code), {})

    report = parse_describe_issue(form.get("DescribeIssue"))
    bug = {
        "bug_code": bug_code,
        "title": meta.get("ShortDescription"),
        # EbugSearch is authoritative for these; GetKernel's AssignedBugHandler is
        # the ASSIGNEE, so trusting it silently disagrees with the ePF board.
        "status": meta.get("Status") or (kernel.get("IF3_Job") or {}).get("ActivityName"),
        "activity": (kernel.get("IF3_Job") or {}).get("ActivityName"),
        "handler": meta.get("Handler"),
        "assignee": meta.get("Assignee") or form.get("AssignedBugHandler"),
        "code_reviewer": meta.get("CodeReviewer"),
        "bug_belong": meta.get("BugBelong"),
        "product": meta.get("ProductName"),
        "product_id": meta.get("ProductID"),
        "template": meta.get("TemplateName"),
        "version": version_from_template(meta.get("TemplateName")) or form.get("Version"),
        "build": meta.get("Build") or form.get("BuildNo"),
        "severity": meta.get("EbugSeverity") or form.get("Severity"),
        "priority": meta.get("EbugPriority") or form.get("Priority"),
        "creator": meta.get("Creator") or header.get("Requester"),
        "create_time": meta.get("CreateTime") or header.get("RequestTime"),
        "due_date": meta.get("DueDate"),
        "close_time": meta.get("CloseTime"),
        "parent_tr": form.get("ParentTRCode"),
        "url": f"{BASE}/IF3/ebug/BPM/FormView/{bug_code}",
        "report": report,
        "attachments": [
            {
                "name": f.get("displayName"),
                "object_key": f.get("objectKey"),
                "content_type": f.get("contentType"),
            }
            for f in (form.get("UploadFiles") or [])
        ],
        "action_buttons": [b.get("ActionName") for b in (kernel.get("ActionButtons") or [])],
        "status_logs": [
            {
                "activity": s.get("ActivityName"),
                "actor": s.get("Actor"),
                "action": s.get("ActionName"),
                "time": s.get("StartTime"),
            }
            for s in (kernel.get("StatusLogs") or [])
        ],
    }
    if not meta:
        bug["_warning"] = ("EbugSearch returned no row for this code; people/status "
                           "fields fall back to GetKernel and may not match the board.")
    if with_comments:
        bug["comments"] = [
            {"time": c.get("CreateTime"), "author": c.get("Creator"),
             "text": c.get("Comment")}
            for c in comments(token, bug_code)
        ]
    return bug


# --- rendering --------------------------------------------------------------

def _block(text):
    return text.strip() if (text or "").strip() else "_(not stated in the report)_"


def render_markdown(bug):
    r = bug["report"]
    lines = [
        f"## {bug['bug_code']} — {bug.get('title') or '(no title)'}",
        "",
        f"- ePF status: {bug.get('status')}",
        f"- Priority: {bug.get('priority')} | Severity: {bug.get('severity')}",
        f"- ePF handler: {bug.get('handler')} | Assignee: {bug.get('assignee')}",
        f"- BugBelong: {bug.get('bug_belong')} | Product: {bug.get('product')}"
        f" | Version: {bug.get('version')} | Build: {bug.get('build')}",
        f"- Reported by {bug.get('creator')} at {bug.get('create_time')}",
        f"- Form: {bug['url']}",
        "- Triage: Pending",
        "- Local status: Pulled",
        "",
        "### Report",
        "",
        "- Short Description:",
        f"  {bug.get('title') or '(none)'}",
        "- Repro Steps:",
    ]
    lines += [f"  {ln}" for ln in _block(r["repro_steps"]).splitlines()]
    lines.append("- Result:")
    lines += [f"  {ln}" for ln in _block(r["result"]).splitlines()]
    lines.append("- Expect Result:")
    lines += [f"  {ln}" for ln in _block(r["expect_result"]).splitlines()]
    if r["note"].strip():
        lines.append("- Note:")
        lines += [f"  {ln}" for ln in r["note"].strip().splitlines()]
    if r["preamble"].strip():
        lines.append("- Unlabelled text in the report:")
        lines += [f"  {ln}" for ln in r["preamble"].strip().splitlines()]

    if bug["attachments"]:
        lines += ["", "### Attachments"]
        lines += [f"- {a['name']}  `{a['object_key']}`" for a in bug["attachments"]]
    if bug.get("comments"):
        lines += ["", "### Comments"]
        for c in bug["comments"]:
            lines.append(f"- **{c['author']}** ({c['time']}): {(c['text'] or '').strip()}")
    if bug.get("_warning"):
        lines += ["", f"> WARNING: {bug['_warning']}"]
    return "\n".join(lines)


def render_table(rows):
    if not rows:
        return "(no results)"
    out = [f"{len(rows)} eBug(s)", ""]
    for r in rows:
        out.append(
            f"{r.get('BugCode'):<16} {str(r.get('Status')):<12} "
            f"P{r.get('EbugPriority')}/S{r.get('EbugSeverity'):<3} "
            f"{str(r.get('BugBelong')):<4} {str(r.get('Handler')):<14} "
            f"{str(r.get('CreateTime'))[:10]}  {r.get('ShortDescription')}"
        )
    return "\n".join(out)


# --- CLI --------------------------------------------------------------------

def _cond_arg(value):
    parsed = json.loads(value)
    return parsed if isinstance(parsed, list) else [parsed]


def main(argv=None):
    p = argparse.ArgumentParser(
        prog="epf_ebug.py", description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("search", help="TSR.EbugSearch (list/metadata, auto-paged)")
    s.add_argument("--product-id", type=int)
    s.add_argument("--ycm-web", action="store_true",
                   help=f"shorthand for --product-id {YCM_WEB_PRODUCT_ID}")
    s.add_argument("--bug-belong")
    s.add_argument("--status", action="append", default=[],
                   help="repeatable; each value is a separate query, then deduped")
    s.add_argument("--pm-open", action="store_true",
                   help=f"shorthand for --bug-belong PM --status {' --status '.join(PM_OPEN_STATUSES)}")
    s.add_argument("--handler")
    s.add_argument("--assignee")
    s.add_argument("--creator")
    s.add_argument("--since", help="CreateTime >= this date, e.g. 2026-09-01")
    s.add_argument("--cond", type=_cond_arg, default=None,
                   help="extra raw conditions as JSON (ANDed with the rest)")
    s.add_argument("--page-size", type=int, default=100)
    s.add_argument("--format", choices=["json", "table"], default="table")

    g = sub.add_parser("get", help="GetKernel: the full report text, no comments")
    g.add_argument("bug_code")
    g.add_argument("--format", choices=["json", "md"], default="md")

    c = sub.add_parser("comments", help="TSR.EbugComments (deduped)")
    c.add_argument("bug_code")
    c.add_argument("--format", choices=["json", "md"], default="md")

    f = sub.add_parser("full", help="kernel + comments + EbugSearch field correction")
    f.add_argument("bug_code")
    f.add_argument("--format", choices=["json", "md"], default="md")

    a = sub.add_parser("attach", help="download every attachment on a bug")
    a.add_argument("bug_code")
    a.add_argument("--out", required=True, help="target directory (use the scratchpad)")

    d = sub.add_parser("download", help="download one attachment by objectKey")
    d.add_argument("object_key")
    d.add_argument("-o", "--out", required=True)

    args = p.parse_args(argv)

    try:
        token = resolve_token()
    except NoToken as exc:
        print(str(exc), file=sys.stderr)
        return 3

    if args.cmd == "search":
        statuses = list(args.status)
        belong = args.bug_belong
        if args.pm_open:
            belong = belong or "PM"
            statuses = statuses or list(PM_OPEN_STATUSES)
        pid = args.product_id or (YCM_WEB_PRODUCT_ID if args.ycm_web else None)
        rows = search(token, conditions=args.cond, product_id=pid, bug_belong=belong,
                      statuses=statuses, handler=args.handler, assignee=args.assignee,
                      creator=args.creator, since=args.since, page_size=args.page_size)
        print(json.dumps(rows, ensure_ascii=False, indent=2)
              if args.format == "json" else render_table(rows))

    elif args.cmd in ("get", "full"):
        bug = full(token, args.bug_code, with_comments=(args.cmd == "full"))
        print(json.dumps(bug, ensure_ascii=False, indent=2)
              if args.format == "json" else render_markdown(bug))

    elif args.cmd == "comments":
        rows = comments(token, args.bug_code)
        if args.format == "json":
            print(json.dumps(rows, ensure_ascii=False, indent=2))
        else:
            for row in rows:
                print(f"- **{row.get('Creator')}** ({row.get('CreateTime')}): "
                      f"{(row.get('Comment') or '').strip()}")

    elif args.cmd == "attach":
        out_dir = Path(args.out).expanduser()
        out_dir.mkdir(parents=True, exist_ok=True)
        form = (get_kernel(token, args.bug_code).get("FormData") or {})
        files = form.get("UploadFiles") or []
        if not files:
            print("(no attachments)")
            return 0
        for item in files:
            key = item.get("objectKey")
            if not key:
                print(f"skip {item.get('displayName')}: no objectKey", file=sys.stderr)
                continue
            data, ctype = download_object(token, key)
            name = item.get("displayName") or Path(key).name
            dest = out_dir / f"{args.bug_code}_{Path(name).name}"
            dest.write_bytes(data)
            print(f"{dest}  ({len(data)} bytes, {ctype})")

    elif args.cmd == "download":
        data, ctype = download_object(token, args.object_key)
        dest = Path(args.out).expanduser()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        print(f"{dest}  ({len(data)} bytes, {ctype})")

    return 0


if __name__ == "__main__":
    sys.exit(main())
