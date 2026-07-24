#!/usr/bin/env python3
"""Generate a self-contained specs/index.html.

Renders every spec markdown file to HTML at build time and embeds it, so the
index works from a double-clicked file:// with no server and no client-side
markdown parser. Re-run after editing any spec:

    python3 specs/build-index.py       # from web-app/

Dependency: `python3 -m pip install markdown`.
"""
from __future__ import annotations
import html
import pathlib
import markdown

SPECS = pathlib.Path(__file__).resolve().parent
OUT = SPECS / "index.html"

# id, file (relative to specs/), name, status, dev, qa
ROWS = [
    ("00", "00-overview.md", "Overview — READ FIRST", "reference",
     "Conventions, ID scheme, the global auth + credits model, and the feature-parity map vs App v3.0.",
     "Start here — global acceptance model, cross-area conventions, and the full TBD registry."),
    ("01", "areas/01-app-shell.md", "App Shell &amp; Global Chrome", "validated",
     "AppShell, Sidebar / BottomBar, TopBar, HeaderActions, AccountMenu, CreditPill; responsive frame (sm/lg).",
     "Chrome renders @390/768/1024/1440; credits badge + account menu; bottom-bar→sidebar switch. 8 AC."),
    ("02", "areas/02-mv-creation.md", "AI Music Video Creation", "golden sample",
     "MvRoom → thinking → StoryboardEditor → creating → MvResult → MvEditor; MvFlowProvider; COST_STORYBOARD / RENDER / REGEN / COVER.",
     "Full MV flow incl. sheets &amp; modes; credit charge + refund-on-fail; insufficient→IAP. 20 AC (reference sample)."),
    ("03", "areas/03-song-creation.md", "AI Song Creation", "validated",
     "SongCompose (Simple/Custom, BPM/Key, Lyrics-Idea), creating, SongResultView / SongDetail; SongFlowProvider; COST_SONG=10.",
     "Simple/Custom compose, Instrumental, Lyrics sheet, 30s free-preview gate, Create Song CTA. 13 AC."),
    ("04", "areas/04-explore-community.md", "Explore &amp; Community", "as-built",
     "HomeView, ExploreView, WatchView, CommunitySongPlayer, CreatorView; community.ts seed.",
     "Feeds render, watch, community song player, creator page. UI-only — curation/ranking is a backend track. 10 AC."),
    ("05", "areas/05-history.md", "History (My Creations)", "validated",
     "HistoryView; useHistory (live + seed merge); filters, ⋯ menu, publish / delete.",
     "Merged list, filters, ⋯ actions, publish/delete, share id. 9 AC."),
    ("06", "areas/06-profile-account.md", "Profile, Account &amp; Settings", "validated",
     "ProfileView, edit profile, LanguageModal, SettingsView (legal / unsubscribe / delete).",
     "Account hub, edit profile, language switch, settings destructive actions. 10 AC."),
    ("07", "areas/07-credits-iap.md", "Credits &amp; IAP", "validated",
     "CreditsProvider; Subscribe / BuyCredits / CreditsDetail modals; lib/user.ts pricing + store SKUs.",
     "Subscriber-only gate, plan/pack selection + badges, per-modal disclaimers @4 widths. 9 AC. ★ Pricing updated 2026-07-24."),
    ("08", "areas/08-proof-of-creation.md", "Proof of Creation", "removed",
     "Removed 2026-07-24 — /proof route + ProofView deleted; no code remains.",
     "Confirm no Get Proof entry anywhere in History; nothing else to check."),
    ("09", "areas/09-auth-onboarding.md", "Auth &amp; Onboarding", "validated",
     "AuthProvider, AuthGuard, mock SignInModal; action-level auth gating (GL-02).",
     "Mock sign-in gate, guarded routes, auth-gated actions (like/publish). Onboarding out of scope. 7 AC."),
    ("10", "areas/10-share.md", "Share", "validated",
     "Public /share/[id] page + the shared ShareDialog component.",
     "Share dialog + public share-link page. Intended gating still open (TBD-GL-07). 6 AC."),
    ("OQ", "OPEN-QUESTIONS.md", "Open Questions", "reference",
     "Cross-area items still needing a PM/designer/RD decision — resolved items live in each area spec instead.",
     "Skim before a review — flags what's still genuinely undecided across areas."),
]

STATUS_CLASS = {
    "validated": "st-ok",
    "golden sample": "st-base",
    "as-built": "st-warn",
    "reference": "st-ref",
    "removed": "st-removed",
}

MD_EXT = ["tables", "fenced_code", "sane_lists", "toc", "attr_list", "nl2br"]


def render_md(path: pathlib.Path) -> str:
    text = path.read_text(encoding="utf-8")
    md = markdown.Markdown(extensions=MD_EXT, output_format="html5")
    return md.convert(text)


def main() -> None:
    docs = []
    for area, rel, name, status, dev, qa in ROWS:
        p = SPECS / rel
        body = render_md(p) if p.exists() else "<p><em>Missing file.</em></p>"
        docs.append((area, rel, name, status, dev, qa, body))

    # Table rows
    tr = []
    for area, rel, name, status, dev, qa, _ in docs:
        cls = STATUS_CLASS.get(status, "st-ref")
        tr.append(f"""      <tr data-doc="{area}" tabindex="0" role="button" aria-label="Open {name} spec">
        <td class="c-area">{area}</td>
        <td class="c-feat"><span class="feat-name">{name}</span><span class="feat-open">Open spec →</span><div class="c-file">{rel}</div></td>
        <td><span class="badge {cls}">{status}</span></td>
        <td class="c-dev">{dev}</td>
        <td class="c-qa">{qa}</td>
      </tr>""")
    rows_html = "\n".join(tr)

    # Hidden rendered docs
    art = []
    for area, rel, name, status, dev, qa, body in docs:
        art.append(f'<article class="doc" id="doc-{area}" data-name="{name}" data-file="{rel}">\n{body}\n</article>')
    docs_html = "\n".join(art)

    # Sidebar nav — every spec, always visible, so switching doesn't require
    # going back to the table first.
    nav = ['      <button class="nav-item" id="nav-index" type="button" data-doc="">\n'
           '        <span class="nav-area">☰</span><span class="nav-name">Index</span>\n      </button>']
    for area, rel, name, status, dev, qa, _ in docs:
        cls = STATUS_CLASS.get(status, "st-ref")
        nav.append(f'''      <button class="nav-item" type="button" data-doc="{area}">
        <span class="nav-area">{area}</span><span class="nav-name">{name}</span>
        <span class="nav-dot {cls}"></span>
      </button>''')
    nav_html = "\n".join(nav)

    out = TEMPLATE.replace("{{ROWS}}", rows_html).replace("{{DOCS}}", docs_html).replace("{{NAV}}", nav_html)
    OUT.write_text(out, encoding="utf-8")
    print(f"wrote {OUT} ({len(out):,} bytes, {len(docs)} specs)")


TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>YouCam Muse Web — Spec Index</title>
<style>
  :root {
    --bg: #ffffff; --bg-2: #f7f7fa; --fg: #16161a; --muted: #5c5c66; --card: #f5f5f7;
    --border: #e4e4ea; --border-2: #d7d7df; --accent: #7c3aed; --accent-soft: #f0e9ff;
    --gold: #b45309; --green: #067a53; --amber: #b45309; --code-bg: #f2f2f5;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0e0e12; --bg-2: #141419; --fg: #f2f2f5; --muted: #a0a0ad; --card: #1a1a20;
      --border: #26262e; --border-2: #33333d; --accent: #a855f7; --accent-soft: #241533;
      --gold: #f59e0b; --green: #34d399; --amber: #fbbf24; --code-bg: #16161b; }
  }
  :root[data-theme="light"] {
    --bg: #ffffff; --bg-2: #f7f7fa; --fg: #16161a; --muted: #5c5c66; --card: #f5f5f7;
    --border: #e4e4ea; --border-2: #d7d7df; --accent: #7c3aed; --accent-soft: #f0e9ff;
    --gold: #b45309; --green: #067a53; --amber: #b45309; --code-bg: #f2f2f5;
  }
  :root[data-theme="dark"] {
    --bg: #0e0e12; --bg-2: #141419; --fg: #f2f2f5; --muted: #a0a0ad; --card: #1a1a20;
    --border: #26262e; --border-2: #33333d; --accent: #a855f7; --accent-soft: #241533;
    --gold: #f59e0b; --green: #34d399; --amber: #fbbf24; --code-bg: #16161b;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--bg); color: var(--fg);
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { max-width: 1140px; margin: 0 auto; padding: 30px 22px 90px; }
  .topbar { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  h1 { font-size: 25px; margin: 0 0 3px; letter-spacing: -0.02em; }
  .sub { color: var(--muted); margin: 0 0 14px; max-width: 760px; }
  .themebtn { border: 1px solid var(--border-2); background: var(--card); color: var(--muted);
    border-radius: 999px; padding: 5px 13px; font-size: 12px; font-weight: 600; cursor: pointer; }
  .pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 18px; }
  .pill { font-size: 12px; font-weight: 600; padding: 5px 11px; border-radius: 999px;
    background: var(--card); border: 1px solid var(--border); color: var(--fg); }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .toolbar { display: flex; gap: 10px; align-items: center; margin: 6px 0 12px; flex-wrap: wrap; }
  #search { flex: 1; min-width: 220px; padding: 9px 13px; border-radius: 10px; font-size: 14px;
    border: 1px solid var(--border-2); background: var(--card); color: var(--fg); }
  .count { color: var(--muted); font-size: 12.5px; }
  .scroll { overflow-x: auto; border: 1px solid var(--border); border-radius: 14px; }
  table { border-collapse: collapse; width: 100%; font-size: 13.5px; min-width: 900px; }
  thead th { position: sticky; top: 0; background: var(--bg-2); color: var(--muted); font-weight: 700;
    text-align: left; padding: 11px 14px; border-bottom: 1px solid var(--border); font-size: 12px;
    text-transform: uppercase; letter-spacing: .04em; z-index: 1; }
  tbody td { padding: 13px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tbody tr { cursor: pointer; transition: background .12s; }
  tbody tr:hover { background: var(--accent-soft); }
  tbody tr:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  tbody tr:last-child td { border-bottom: 0; }
  .c-area { font-weight: 800; color: var(--muted); font-size: 12px; white-space: nowrap; }
  .c-feat { min-width: 190px; }
  .feat-name { font-weight: 700; font-size: 14.5px; }
  .feat-open { display: block; font-size: 11.5px; color: var(--accent); font-weight: 600; margin-top: 1px; }
  .c-file { font-size: 11px; color: var(--muted); font-family: ui-monospace, Menlo, monospace; margin-top: 3px; }
  .c-dev { color: var(--fg); max-width: 320px; }
  .c-qa { color: var(--muted); max-width: 320px; }
  .badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
  .st-ok { color: var(--green); border: 1px solid var(--green); }
  .st-base { color: var(--accent); border: 1px solid var(--accent); }
  .st-warn { color: var(--amber); border: 1px solid var(--amber); }
  .st-ref { color: var(--muted); border: 1px solid var(--border-2); }
  .st-removed { color: var(--muted); border: 1px solid var(--border-2); text-decoration: line-through; }
  .legend { color: var(--muted); font-size: 12.5px; margin: 16px 0 0; }
  footer { margin-top: 30px; color: var(--muted); font-size: 12px; }

  /* Shell: persistent sidebar + content pane (index table or doc reader) */
  .shell { display: flex; align-items: flex-start; min-height: 100vh; }
  .sidenav { position: sticky; top: 0; height: 100vh; overflow-y: auto; width: 232px; flex-shrink: 0;
    border-right: 1px solid var(--border); padding: 18px 10px 30px; background: var(--bg-2); }
  .sidenav-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
    color: var(--muted); padding: 4px 10px 10px; }
  .nav-item { display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; border: 0;
    background: none; color: var(--fg); padding: 8px 10px; border-radius: 9px; font-size: 13px;
    cursor: pointer; font-family: inherit; }
  .nav-item:hover { background: var(--card); }
  .nav-item.active { background: var(--accent-soft); color: var(--accent); font-weight: 700; }
  .nav-area { font-size: 11px; font-weight: 800; color: var(--muted); min-width: 16px; }
  .nav-item.active .nav-area { color: var(--accent); }
  .nav-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nav-dot { width: 7px; height: 7px; border-radius: 50%; border: 1.5px solid currentColor; flex-shrink: 0; }
  #nav-index { margin-bottom: 8px; font-weight: 700; }
  .content { flex: 1; min-width: 0; }

  /* Reader pane (swaps with the index table inside .content) */
  .reader { display: none; flex-direction: column; }
  .reader.open { display: flex; }
  .wrap.hidden { display: none; }
  .reader-bar { display: flex; align-items: center; gap: 12px; padding: 18px 22px 14px;
    border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .reader-bar .back { border: 1px solid var(--border-2); background: var(--card); color: var(--fg);
    border-radius: 9px; padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .reader-bar .rtitle { font-weight: 700; }
  .reader-bar .rfile { color: var(--muted); font-size: 12px; font-family: ui-monospace, Menlo, monospace; }
  .reader-scroll { padding: 26px 22px 90px; }
  .doc-frame { max-width: 860px; margin: 0 auto; }
  .doc { display: none; }
  .doc.active { display: block; }

  @media (max-width: 820px) {
    .shell { flex-direction: column; }
    .sidenav { position: static; width: 100%; height: auto; display: flex; overflow-x: auto;
      overflow-y: hidden; border-right: 0; border-bottom: 1px solid var(--border); padding: 10px 12px;
      gap: 4px; }
    .sidenav-title { display: none; }
    .nav-item { flex-shrink: 0; width: auto; }
    .nav-name { white-space: nowrap; }
  }

  /* Rendered-markdown typography */
  .doc h1 { font-size: 26px; margin: 0 0 14px; letter-spacing: -0.02em; }
  .doc h2 { font-size: 20px; margin: 30px 0 10px; padding-bottom: 5px; border-bottom: 1px solid var(--border); }
  .doc h3 { font-size: 16px; margin: 22px 0 8px; }
  .doc h4 { font-size: 14px; margin: 18px 0 6px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  .doc p, .doc li { color: var(--fg); }
  .doc a { color: var(--accent); }
  .doc code { background: var(--code-bg); border: 1px solid var(--border); border-radius: 5px;
    padding: 0 5px; font-size: 12.5px; font-family: ui-monospace, Menlo, monospace; }
  .doc pre { background: var(--code-bg); border: 1px solid var(--border); border-radius: 10px;
    padding: 14px 16px; overflow-x: auto; }
  .doc pre code { border: 0; padding: 0; background: none; font-size: 12.5px; line-height: 1.5; }
  .doc pre code.language-mermaid { color: var(--muted); }
  .doc blockquote { margin: 14px 0; padding: 8px 16px; border-left: 3px solid var(--accent);
    background: var(--accent-soft); border-radius: 0 8px 8px 0; color: var(--muted); }
  .doc blockquote p { color: inherit; }
  .doc table { border-collapse: collapse; width: 100%; min-width: 0; font-size: 13px; margin: 12px 0;
    display: block; overflow-x: auto; }
  .doc th, .doc td { border: 1px solid var(--border); padding: 7px 11px; text-align: left; vertical-align: top; }
  .doc th { background: var(--bg-2); font-weight: 700; }
  .doc hr { border: 0; border-top: 1px solid var(--border); margin: 26px 0; }
  .doc ul, .doc ol { padding-left: 22px; }
  .doc li { margin: 3px 0; }
  @media (max-width: 600px) { .reader-scroll { padding: 18px 14px 80px; } }
</style>
</head>
<body>
<div class="shell">
  <nav class="sidenav" aria-label="Spec navigation">
    <div class="sidenav-title">Specs</div>
{{NAV}}
  </nav>

  <div class="content">
    <div class="wrap" id="indexview">
      <div class="topbar">
        <div>
          <h1>YouCam Muse Web — Spec Index</h1>
          <p class="sub">As-built specification of <code>web-app/</code> (Next.js 16 · React 19 · TS strict).
          Click any row (or a spec in the sidebar) to read the full spec, rendered. Code is the source of
          truth; divergences from the mobile App Spec v3.0 and open decisions are flagged inline.</p>
        </div>
        <button class="themebtn" id="theme" type="button">◐ Theme</button>
      </div>

      <div class="pills">
        <span class="pill">🗂️ 10 feature areas + overview</span>
        <span class="pill">🛠️ <a href="../docs/handoff-2026-07-23.md">Codebase handoff</a></span>
        <span class="pill">💳 Pricing synced to the Business Model (2026-07-24)</span>
      </div>

      <div class="toolbar">
        <input id="search" type="search" placeholder="Filter specs — feature, dev component, QA…" aria-label="Filter specs" />
        <span class="count" id="count"></span>
      </div>

      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th>Area</th><th>Feature</th><th>Status</th>
              <th>For developers</th><th>For QA</th>
            </tr>
          </thead>
          <tbody id="tbody">
{{ROWS}}
          </tbody>
        </table>
      </div>

      <p class="legend">
        <b>Status:</b> <span class="badge st-ok">validated</span> rendered + checked ·
        <span class="badge st-base">golden sample</span> reference build ·
        <span class="badge st-warn">as-built</span> shipped, curation/back-end deferred ·
        <span class="badge st-ref">reference</span> conventions / registry ·
        <span class="badge st-removed">removed</span> deleted from the codebase.
        &nbsp; IDs are area-qualified (<code>AC-MV-01</code>, <code>TBD-GL-01</code>); ⚠️ = divergence from App v3.0 ·
        ❓ = open decision · 🔒 = mock / in-memory / seed.
      </p>

      <footer>Basis: as-built from <code>web-app/src/</code> · App reference: YouCam Muse Spec v3.0 + Explore Curation PRD + Business Model 2026-07-13.<br>
      Regenerate after editing a spec: <code>python3 specs/build-index.py</code>.</footer>
    </div>

    <div class="reader" id="reader">
      <div class="reader-bar">
        <button class="back" id="back" type="button">← Back to index</button>
        <span class="rtitle" id="rtitle"></span>
        <span class="rfile" id="rfile"></span>
      </div>
      <div class="reader-scroll">
        <div class="doc-frame" id="docframe">
{{DOCS}}
        </div>
      </div>
    </div>
  </div>
</div>

<script>
(function () {
  var root = document.documentElement;
  // Theme toggle (persists in localStorage; defaults to OS)
  try {
    var saved = localStorage.getItem("spec-theme");
    if (saved) root.setAttribute("data-theme", saved);
  } catch (e) {}
  document.getElementById("theme").addEventListener("click", function () {
    var cur = root.getAttribute("data-theme");
    var isDark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = isDark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("spec-theme", next); } catch (e) {}
  });

  var reader = document.getElementById("reader");
  var indexview = document.getElementById("indexview");
  var docs = document.querySelectorAll(".doc");
  var rtitle = document.getElementById("rtitle");
  var rfile = document.getElementById("rfile");
  var scroller = document.querySelector(".reader-scroll");
  var navItems = document.querySelectorAll(".nav-item");

  function setActiveNav(area) {
    navItems.forEach(function (b) {
      b.classList.toggle("active", (b.getAttribute("data-doc") || "") === (area || ""));
    });
  }

  function open(area) {
    var target = document.getElementById("doc-" + area);
    if (!target) return;
    docs.forEach(function (d) { d.classList.remove("active"); });
    target.classList.add("active");
    rtitle.textContent = target.getAttribute("data-name").replace(/&amp;/g, "&");
    rfile.textContent = target.getAttribute("data-file");
    reader.classList.add("open");
    indexview.classList.add("hidden");
    setActiveNav(area);
    window.scrollTo(0, 0);
    if (scroller) scroller.scrollTop = 0;
    if (location.hash !== "#" + area) history.replaceState(null, "", "#" + area);
  }
  function close() {
    reader.classList.remove("open");
    indexview.classList.remove("hidden");
    setActiveNav("");
    window.scrollTo(0, 0);
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  document.querySelectorAll("#tbody tr").forEach(function (row) {
    row.addEventListener("click", function () { open(row.getAttribute("data-doc")); });
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(row.getAttribute("data-doc")); }
    });
  });
  navItems.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var area = btn.getAttribute("data-doc");
      if (area) open(area); else close();
    });
  });
  document.getElementById("back").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  // Filter
  var search = document.getElementById("search");
  var rows = Array.prototype.slice.call(document.querySelectorAll("#tbody tr"));
  var count = document.getElementById("count");
  function refresh() {
    var q = search.value.trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (r) {
      var hit = !q || r.textContent.toLowerCase().indexOf(q) !== -1;
      r.style.display = hit ? "" : "none";
      if (hit) shown++;
    });
    count.textContent = shown + " / " + rows.length + " specs";
  }
  search.addEventListener("input", refresh);
  refresh();

  // Deep-link on load
  if (location.hash.length > 1) open(location.hash.slice(1));
})();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
