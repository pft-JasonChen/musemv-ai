# ePF eBug API — contract, script usage, and what the vendor docs get wrong

Every endpoint and field below was exercised live on **2026-09-18** against real YouCam
Muse Web tickets. Where this file disagrees with `eBug-取單完整串接指南.md` or
`ePF_MCP_全功能文件.md`, **this file is what the server actually did** — the corrections
are called out individually so nobody "fixes" the script back to the doc.

## Credentials

- **Base URL**: `https://eperfect.perfectcorp.com`
- **Auth**: `Authorization: Bearer <token>` on every call — one token for all four endpoints.
- **Token type**: an ePF **REST API Bearer token**. This is *not* a browser OIDC session,
  and it does not work on the human-facing web/download URLs (see pitfall 6).
- **Apply for one**: <https://eperfect.perfectcorp.com/sso/mgm/tokenPage>
- **Where it lives**: `EPF_API_TOKEN` in the repo-root `.env`, which the root `.gitignore`
  excludes. `.env.example` is the committed placeholder. Resolution order:

  1. `$EPF_API_TOKEN` in the environment
  2. `<repo root>/.env`
  3. `<repo root>/web-app/.env.local`
  4. `~/.config/ycm-ebug/.env`

**Never** commit the token, paste it into a ledger, a commit message, an eBug comment, or
any file under `src/`. If it leaks, apply for a new one at the link above.

## The script

`scripts/epf_ebug.py` — Python 3 stdlib only, no `pip install`, read-only against ePF.
Run it from anywhere inside the checkout.

```bash
# The canonical pull: PM-owned YouCam Muse Web bugs that are still open
python3 web-app/.claude/skills/ycm-ebug-fix/scripts/epf_ebug.py search --ycm-web --pm-open

# One complete ticket: report text + attachments + comments, ledger-shaped
python3 .../epf_ebug.py full YMW260915P0012

# Same, as JSON, when you need to pick fields out programmatically
python3 .../epf_ebug.py full YMW260915P0012 --format json

# Attachments as real bytes, into the scratchpad (never into the repo)
python3 .../epf_ebug.py attach YMW260915P0012 --out "$SCRATCHPAD/ebug"
```

Other subcommands: `get <BugCode>` (report text, no comments), `comments <BugCode>`,
`download <objectKey> -o <file>`. `search` also takes `--status` (repeatable),
`--handler`, `--assignee`, `--creator`, `--since`, `--product-id`, and `--cond '<json>'`
for raw extra conditions.

`--ycm-web` is `ProductID 315`; `--pm-open` is `BugBelong PM` plus statuses
`NewCreated` and `Assigned`.

Exit `3` means no token was found; the message tells the user how to apply. **That is a
stop, not a cue to fall back to scraping the ePF web UI.**

## The four endpoints

One ticket is not one API. `full` composes ①②③; `attach` adds ④.

| # | What you get | Endpoint | Method |
|---|---|---|---|
| ① | List / filter / metadata | `/IF3/tsr/api/Public/Query/TSR.EbugSearch` | POST |
| ② | The complete form: report text, attachments, flow, actions | `/IF3/ebug/BPM/GetKernel?FormCode=<code>` | GET |
| ③ | Comment thread | `/IF3/tsr/api/Public/Query/TSR.EbugComments` | POST |
| ④ | Attachment bytes | `/IF3/ebug/Data/DownloadByToken?o=<objectKey>` | GET |

### ① TSR.EbugSearch

Request body: `{queryModel, conditions[], pageIndex, pageSize, sortBy, isDesc}`.
Conditions are **ANDed**. Operators that work here: `term` (exact), `termNot` (≠),
`match` (fuzzy), `range` (`gte`/`lte`), `isNull`.

Response rows: `JobID, BugCode, ShortDescription, Status, BugBelong, Handler, Assignee,
ProductName, ProductID, TemplateName, TemplateID, Build, CloseToBuild, EbugSeverity,
EbugPriority, CreateTime, CloseTime, DueDate, Creator, CodeReviewer, Tags`.

### ② GetKernel

- `FormData.DescribeIssue` — **the whole report as one string.** The `Repro Steps:` /
  `Result:` / `Expect Result:` / `Note:` labels are a writing convention, not a schema;
  `parse_describe_issue()` splits them and keeps anything unlabelled under `preamble`
  rather than dropping it.
- `FormData.UploadFiles[]` — `{displayName, objectKey, filePath, fileURL, presignedURL,
  fileID, contentType}`. `contentType` is often empty; `presignedURL` is usually empty.
- `FormData.{Version, BuildNo, Severity, Priority, ProblemType, ParentTRCode, Customer,
  DeviceModel, OSVersion, AssignedBugHandler}`
- `IF3_Job.ActivityName` — current workflow activity (`Assigned`, `Close`, …)
- `StatusLogs[]` — the flow trail; `ActionButtons[]` — what could be done next
- `FormHeader.{FormCode, Requester, RequestTime, JobID}`

### ③ TSR.EbugComments

Condition on `BugCode`. Sort `CreateTime` ascending to read the thread in order.

### ④ DownloadByToken

`o` takes the **objectKey** (`iForm/2026/09/15/xxxx.jpg`), and returns the raw bytes with
a real content type. Verified: a 69,710-byte 1892×982 JPEG came back as a valid JPEG.
Because these are real files on disk, screenshots on a ticket can now be **looked at**
during triage — which the SSO-browser route never reliably gave us.

## Pitfalls

Numbers 1–8 come from the vendor guide and were re-confirmed. 9 and 10 **contradict the
vendor docs** and were measured here.

1. **The body key is `conditions` (a JSON array), not `conditionsJson` (a string).**
   Sending `conditionsJson` returns HTTP 200 with `status:"fail"` and "Fatal error
   encountered during command execution" — which reads like a server fault and is not one.
   (The MCP tool `query_data` *does* take `conditionsJson`; the REST endpoint does not.
   Two different front doors, two different shapes.)
2. **An empty `conditions` array times out** rather than returning everything. Always send
   at least one condition. `search` refuses to issue a condition-less query.
3. **`Handler` ≠ `Assignee` ≠ `AssignedBugHandler`.** EbugSearch's `Handler` is what the
   ePF board shows (usually QA/owner); its `Assignee` is who currently owns the action.
   **GetKernel's `AssignedBugHandler` is the Assignee, not the Handler.** Display
   GetKernel's field as "handler" and your ledger silently disagrees with the board.
   `full` resolves this by letting EbugSearch win on handler/status/product.
4. **EbugSearch has no `Version` field in its response**, though you *can* query on one.
   The version is the tail of `TemplateName` ("YouCam Muse Web 1.0" → `1.0`);
   `version_from_template()` does that.
5. **`Severity`/`Priority` change type between endpoints** — strings (`"2"`) from
   EbugSearch, integers (`2`) from GetKernel. `99` or `0`/empty means unset.
6. **`UploadFiles[].fileURL` is a link for a human in a browser.** It goes through OIDC
   cookies; a Bearer token gets a 302 to the SSO login page and you receive login HTML
   instead of a file. Always use ④ for bytes. (`_request` detects the HTML case and says so.)
7. **④'s path must contain the `/ebug/` service segment** — `/IF3/ebug/Data/DownloadByToken`.
   Without it you get a 500 (`WebClient request exception`). Passing a full `fileURL` as
   `o` instead of the bare objectKey also 500s (`No found file`).
8. **A successful Public Query has no `status` key at all** — it returns `{total, results}`
   directly. Only an explicit `status:"fail"` is a failure. Don't test for `status == "ok"`.
9. **CORRECTION — the `terms` (IN) operator is broken on Public Query.** The MCP doc
   documents `{"field":"Status","terms":{"querys":["A","B"]}}`, but on this endpoint
   *every* shape of `terms` — even a single-element list — returns
   `status:"fail"` with a MySQL syntax error (`... near ') r' at line 1`). So there is no
   server-side OR: **run one query per value and dedupe by BugCode**, which is what
   `search` does. `termNot` works fine, if an exclusion expresses what you need.
   After a union, sort globally by `CreateTime` before paging — per-pass ordering only
   sorts within one value.
10. **CORRECTION — comment rows use `Comment`, not `Content`, and have no
    `ActivityName`.** The guide lists `CreateTime, Creator, Content, ActivityName`; the
    server actually returns `BugCode, JCID, JobID, FlowAID, Comment, CreateTime, Creator,
    LastModifyTime, IsValid`. ePF also stores **genuine duplicate comment rows** — same
    author, same text, seconds apart (seen on `YMW260915P0012`, JCIDs 239854/239855) — so
    dedupe before quoting a thread or you will report the same request twice.
11. **Multi-person handler fields split on commas.** A `Handler` can read `"A, B"`; any
    per-person tally must split first, or one person is scattered across combined strings.

## Transport

`scripts/epf_ebug.py` shells out to **curl** rather than using `urllib`, and falls back to
`urllib` only if curl is absent. The reason is not style: `urllib` verifies against
Python's own CA bundle, and a stock python.org build on macOS ships **without one** — no
`certifi`, no `cert.pem`. Every ePF call then fails with "self-signed certificate in
certificate chain" even though the real chain is an ordinary DigiCert one, which looks
exactly like a corporate TLS-interception problem and is not. curl uses the OS trust
store and is present on macOS, Linux, and Windows 10+.

The token is passed to curl through a config file on **stdin** (`-K -`), never in argv,
so it does not show up in `ps` for other users on the machine.

## Alternative: the ePF MCP connector

If the `epf-mcp-prod` MCP server is authorized in the session, `query_data`
(`serviceCode: "tsr"`, `queryModel: "TSR.EbugSearch"`) and `get_form`
(`serviceCode: "ebug"`, `formCode: <BugCode>`) cover ① and ②+③. It needs no local token,
but it is not available in every session and its `conditionsJson` is a **string**, not an
array. The REST script is the default because it works in any session that has a token.

## What this API cannot do

It is read-only for our purposes. The skill never changes a ticket's assignee, status, or
comments. The reply comment produced in Step 4 is written for the **user to paste in**.
`ActionButtons[]` reveals what the workflow *would* allow — treat that as context, not as
an invitation.
