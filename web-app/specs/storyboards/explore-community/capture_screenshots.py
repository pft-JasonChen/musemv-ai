#!/usr/bin/env python3
"""Capture the Explore & Community (S8) screenshots AND measure every focus box.

Screenshot source: **live app capture**, not a static prototype -- the same
convention every other spec in this programme follows. Every screenshot comes
from driving the real Next.js dev server on :3000 with Playwright, signed in
via the same `localStorage['muse_auth']` seed the e2e specs use.

VIEWPORT -- D8 stands: desktop 1403x697 only, this repo's established capture
viewport (song-creation / history / shell-auth / mv-edit / profile-account /
credits-iap all use it), so every focus box is a percentage of the same
captured container.

FOUR BROWSER SESSIONS, AND EACH ONE IS FORCED BY THE APP, NOT BY STYLE
====================================================================
  Session A (`main_public`) -- SIGNED IN, walks P1's rails, P2, P3, P5.
  Session B (`main_watch`)  -- SIGNED IN, walks P4 alone. It is separate
        because the swipe gesture MUTATES the feed cursor and the URL
        (`router.replace`), and `lastSyncedIdRef` hard-resets all three video
        slots on any EXTERNAL id change -- so a session that has already
        swiped is not a clean starting point for the next `/watch` shot.
  Session C (`main_guest`)  -- NOT signed in (no `muse_auth` seed), for the
        `requireLogin` gates (AC-EXP-02 / AC-EXP-08). It cannot be folded into
        A: `requireLogin` runs the action straight through once the session is
        authenticated, so the modal simply never opens there.
  Session D (`main_demo`)   -- SIGNED IN + `?demo=1`, for `profileEmpty`
        (AC-EXP-12 / EXP-E6). `CREATOR_MVS`/`CREATOR_SONGS` are fixed module
        constants, so this flag is the ONLY way that empty UI is reachable at
        all.

TWO ENVIRONMENT FACTS MEASURED DURING THIS RUN, BOTH RECORDED IN build_spec.py
=============================================================================
1. **Every mp4 in these captures is a BLACK RECTANGLE.** Probed on this
   machine 2026-09-01, on every `<video>` on `/`, `/watch` and `/creator`:
   `MediaError 4 DEMUXER_ERROR_NO_SUPPORTED_STREAMS: FFmpegDemuxer: no
   supported streams`. This is AGENTS.md's documented "Playwright's Chromium
   cannot decode H.264" limit, and it IS in force here -- S2's capture note
   ("MV's videos photograph") was measured on a different machine and does not
   transfer. Consequences, in order of how much they cost:
     · The home hero photographs FINE anyway, because `HeroBannerSectionV3`
       passes `poster={item.thumbnail}` -- the poster is exactly what a
       non-decoding browser shows.
     · `/watch`'s stage does NOT. `CommunityMvPlayer`'s `<video>` elements
       carry no `poster`, so P4's stage is black in every shot. Everything the
       spec actually asserts there -- the floating title/creator, like/share,
       the CTA, the transport, the watermark, and the swipe's own translate --
       is chrome ON TOP of the stage and photographs correctly.
     · NOT worked around by injecting a poster at capture time. A screenshot
       showing something the app does not render is a fabricated capture, and
       the provenance rule outranks a prettier picture. Recorded as a
       `decisions` row and reported to the product owner as a one-line
       recommendation instead (add `poster={mv.thumb}` to the three slot
       videos, the same attribute the hero already carries).
2. **The swipe gesture is real and was exercised, not assumed.** Measured
   here: stage height 578.25px -> commit threshold 66.75px (80/693); a -202px
   drag on `/watch?id=trend-adventurous-echoes` committed to
   `trend-thrilling-harmonies` with the URL replaced; a -10px drag changed
   nothing; and `/watch?id=cp-cinematic-night` (a `CREATOR_MVS` id, outside
   `MV_LIST`) rendered ONE `<video>` instead of three and never committed
   however far it was dragged. All three are asserted inline below -- the run
   fails loudly rather than photographing a gesture that silently did nothing.

USAGE
    # dev server already running on :3000
    python3 capture_screenshots.py [--base http://localhost:3000]
    python3 build_spec.py
"""
import argparse
import asyncio
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/explore-community
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, "skills", "yco-spec"))

_SHARED = os.path.expanduser("~/Library/Caches/ms-playwright")
if "PLAYWRIGHT_BROWSERS_PATH" not in os.environ and os.path.isdir(_SHARED):
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = _SHARED

from capture_lib import Capture  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402
from PIL import Image  # noqa: E402

DESKTOP = (1403, 697)


def chromium_path():
    """AGENTS.md's `CHROMIUM_PATH` escape hatch, resolved automatically.

    Playwright pins a browser BUILD NUMBER; a sandbox image ships whichever
    build it was baked with. When they differ, `launch()` dies naming a build
    that "doesn't exist" and tells you to run `playwright install` -- which
    AGENTS.md explicitly says not to do. Point it at the binary that IS there
    instead. `None` means "use Playwright's own", which is right on a machine
    where the pin matches.
    """
    env = os.environ.get("CHROMIUM_PATH")
    if env and os.path.exists(env):
        return env
    for pat in ("/opt/pw-browsers/chromium-*/chrome-linux/chrome",
                "/opt/pw-browsers/chromium_headless_shell-*/"
                "chrome-headless-shell-linux64/chrome-headless-shell"):
        hits = sorted(glob.glob(pat))
        if hits:
            return hits[-1]
    return None


class NextCapture(Capture):
    """`Capture` against an already-running Next dev server -- identical to
    every other storyboard spec's own `NextCapture`, plus `seed_auth=False`
    for the guest session (C) that must NOT be signed in."""

    def __init__(self, feature_dir, base_url, seed_auth=True, **kw):
        kw.setdefault("viewport", DESKTOP)
        super().__init__(feature_dir, "", **kw)
        self.base_url = base_url.rstrip("/")
        self.seed_auth = seed_auth

    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            executable_path=chromium_path(),
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await self._browser.new_context(
            viewport=self.viewport, device_scale_factor=1)
        if self.seed_auth:
            await ctx.add_init_script("window.localStorage.setItem('muse_auth', '1')")
        # Hide Next.js's dev-mode build-activity indicator (`<nextjs-portal>`),
        # which sits at the same fixed bottom-left corner as the demo panel and
        # intercepts clicks there -- see `js_click`'s own docstring.
        await ctx.add_init_script(
            "document.addEventListener('DOMContentLoaded', () => {"
            " const s = document.createElement('style');"
            " s.textContent = 'nextjs-portal{display:none!important}';"
            " document.head.appendChild(s);"
            "});"
        )
        self.page = await ctx.new_page()
        self.page.on("console", lambda m: self.errors.append(m.text)
                     if m.type == "error" else None)
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        return self

    async def __aexit__(self, *a):
        self._server = None
        # MERGE with whatever is already on disk instead of clobbering it --
        # FOUR separate `Capture` instances write this run's focus.json; the
        # base class's wholesale write would drop the earlier sessions.
        if self.focus_map and os.path.exists(self.focus_path):
            with open(self.focus_path, encoding="utf-8") as f:
                existing = json.load(f)
            existing.update(self.focus_map)
            self.focus_map = existing
        return await super().__aexit__(*a)

    async def full_shot(self, name):
        """Full-page PNG; returns the container box `focus()` needs, read back
        from the SAVED FILE's real pixel size."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=True)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}

    async def viewport_shot(self, name):
        """Plain (non-full-page) viewport PNG. Reserved for any state with a
        `position: fixed` element -- a modal overlay, the `SongPlayBar`, a
        portalled row menu, or the demo panel -- which a full-page shot's
        artificially tall viewport would reposition."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=False)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}


async def js_click(page, selector):
    """Click via direct DOM `.click()`, bypassing pointer actionability. Needed
    for every demo-panel control -- a normal (or even `force=True`) click on
    that corner lands on Next's dev-mode overlay instead."""
    ok = await page.evaluate(
        "(sel) => { const el = document.querySelector(sel);"
        " if (el) { el.click(); return true; } return false; }", selector)
    if not ok:
        raise SystemExit(f"js_click: selector matched nothing: {selector}")


async def js_click_text(page, tag, text, root=None):
    ok = await page.evaluate(
        """([tag, text, root]) => {
            const scope = root ? document.querySelector(root) : document;
            if (!scope) return false;
            const els = [...scope.querySelectorAll(tag)];
            const el = els.find((e) => e.textContent.trim() === text);
            if (el) { el.click(); return true; }
            return false;
        }""", [tag, text, root])
    if not ok:
        raise SystemExit(f"js_click_text: no <{tag}> with text {text!r} under {root}")


async def check(page, targets):
    """Fail loudly on a focus selector matching nothing, or matching a
    hidden/ambiguous duplicate."""
    for sel in targets:
        loc = page.locator(sel)
        n = await loc.count()
        if n == 0:
            raise SystemExit(f"focus selector matched nothing: {sel}")
        vis = await loc.filter(visible=True).count()
        if n > 1 and vis != 1:
            raise SystemExit(
                f"focus selector {sel} matched {n} elements ({vis} visible) -- narrow it")


def make_shoot(cap, page, full_page=True):
    """`full_page=False` for any state with a `position: fixed` element."""
    async def shoot(name, targets=None, label=None, kind="action"):
        await page.wait_for_timeout(200)
        if targets:
            await check(page, targets)
        cb = await (cap.full_shot(name) if full_page else cap.viewport_shot(name))
        if targets:
            await cap.focus(name, cb, targets, label, kind=kind)
            x, y, w, h = cap.focus_map[name][-1]["box"]
            if not (0 <= x < 100 and 0 <= y < 100 and 0 < w <= 100 and 0 < h <= 100
                    and x + w <= 101 and y + h <= 101):
                raise SystemExit(
                    f"{name}: focus box {[x, y, w, h]} is outside its own "
                    f"screenshot -- the frame would miss the control")
    return shoot


async def multi_focus(cap, page, name, frames, full_page=True):
    """Same shot, MULTIPLE labeled frames."""
    await page.wait_for_timeout(200)
    for targets, _label, _kind in frames:
        await check(page, targets)
    cb = await (cap.full_shot(name) if full_page else cap.viewport_shot(name))
    for targets, label, kind in frames:
        await cap.focus(name, cb, targets, label, kind=kind)
        x, y, w, h = cap.focus_map[name][-1]["box"]
        if not (0 <= x < 100 and 0 <= y < 100 and 0 < w <= 100 and 0 < h <= 100
                and x + w <= 101 and y + h <= 101):
            raise SystemExit(
                f"{name}: focus box {[x, y, w, h]} is outside its own screenshot")


async def freeze_media(page):
    """Pause and rewind every `<video>`/`<audio>` before a shot.

    Two different reasons, both real here: an autoplaying element gives a
    different frame every run (S2's own note), and the `<audio>` elements the
    song screens drive would otherwise keep the transport time advancing
    between the shot and the focus measurement. On this machine no mp4 decodes
    at all (see the module docstring), so this is belt-and-braces for the
    video half and load-bearing for the audio half."""
    await page.evaluate(
        """() => { for (const m of document.querySelectorAll('video, audio')) {
             try { m.pause(); m.currentTime = 0; } catch {} } }""")
    await page.wait_for_timeout(120)


async def modal_settled(page, overlay_sel):
    """Wait until the named overlay reads opacity 1 -- AGENTS.md's rule that no
    DP overlay is measured while it is still animating in."""
    await page.wait_for_selector(overlay_sel, state="visible")
    await page.wait_for_function(
        "(sel) => { const o = document.querySelector(sel);"
        " return o && getComputedStyle(o).opacity === '1'; }",
        arg=overlay_sel, timeout=4000)
    await page.wait_for_timeout(150)


async def drag_stage(page, dy, steps=14, release=True):
    """Pointer-drag the `/watch` stage by `dy` px (negative = swipe up = next).

    Mouse events, not touch: `CommunityMvPlayer` attaches POINTER handlers
    unconditionally (no width gate, no touch-only branch), which is exactly
    why the gesture is in scope for a desktop-only spec at all."""
    box = await page.locator(".mv-player__stage").bounding_box()
    cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    for i in range(1, steps + 1):
        await page.mouse.move(cx, cy + dy * i / steps)
        await page.wait_for_timeout(16)
    if release:
        await page.mouse.up()
    return box


async def open_demo_panel(page):
    await js_click_text(page, "button", "DEMO")
    await page.wait_for_selector('aside[aria-label="Demo state panel"]', state="visible")
    await page.wait_for_timeout(150)


async def toggle_flag(page, label, on):
    await js_click(page, f'[role="switch"][aria-label="{label}"]')
    await page.wait_for_timeout(120)


async def collapse_demo_panel(page):
    await js_click(page, 'button[aria-label="Collapse demo panel"]')
    await page.wait_for_timeout(150)




async def bar_settled(page, want_open=True):
    """Wait for `SongPlayBar`'s slide transition to finish.

    The bar is ALWAYS MOUNTED once there is an active song (product owner,
    2026-08-14) and `open` drives a transform, so `toBeVisible()` is true while
    it is still parked below the fold — AGENTS.md's "never measure a DP overlay
    while it is animating" applies to it exactly. Closed parks its top at the
    viewport's own bottom edge; open sits above it."""
    await page.wait_for_selector(".song-bar", state="attached", timeout=5000)
    await page.wait_for_function(
        """(open) => { const b = document.querySelector('.song-bar');
             if (!b) return false;
             const t = b.getBoundingClientRect().top;
             return open ? t < window.innerHeight - 8 : t >= window.innerHeight - 1; }""",
        arg=want_open, timeout=5000)
    await page.wait_for_timeout(250)


async def play_row(page, root=".song-detail__list-item"):
    """Press a list row's own Play control (`aria-label="Play <title>"`)."""
    ok = await page.evaluate(
        """(root) => { const r = document.querySelector(root); if (!r) return false;
             const b = [...r.querySelectorAll('button')]
               .find(x => /^Play /.test(x.getAttribute('aria-label') || ''));
             if (b) { b.click(); return true; } return false; }""", root)
    if not ok:
        raise SystemExit(f"play_row: no Play control under {root}")


# ── Session A: signed in — P1 rails, P2, P3, P5 ─────────────────────────────
async def main_public(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        fixed = make_shoot(cap, page, full_page=False)

        # ══ P1 — Home feed ══════════════════════════════════════════════════
        await page.goto(f"{base}/", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)

        # Desktop pair: ToolSelectorSectionV3 ABOVE HeroBannerSectionV3 (the
        # order inverts below 768px — HomeView branches in JS, not CSS).
        if await page.locator(".tool-selector-v3").count() != 1:
            raise SystemExit("desktop tool selector missing — wrong hero/tool branch?")
        await multi_focus(cap, page, "01_home_hero_tools.png", [
            ([".tool-selector-v3__row"], "Two gated create cards", "action"),
            ([".hero-banner-v3"], "Hero filmstrip — only the centred card plays", "info"),
        ])

        await multi_focus(cap, page, "02_home_three_rails.png", [
            ([".new-mvs"], "Trending Music Videos — fed by NEW_MVS", "info"),
            ([".top-picks"], "Top Picks Songs", "info"),
            ([".new-songs"], "Newly Released Songs — 6 rows, 2 columns", "info"),
        ])

        # Rail arrows appear only when the row can scroll that way.
        if await page.locator(".new-mvs__previous").count() != 0:
            raise SystemExit("Trending rail showed a Previous arrow at scroll 0")
        await shoot("03_home_rail_next.png", [".new-mvs__next"],
                    "Next — rendered only while the row can scroll forward")
        await js_click(page, ".new-mvs__next button")
        await page.wait_for_timeout(700)
        if await page.locator(".new-mvs__previous").count() != 1:
            raise SystemExit("Previous arrow did not appear after scrolling forward")
        await shoot("04_home_rail_scrolled.png", [".new-mvs__previous"],
                    "Previous appears once the row has scrolled")

        # Album art previews in the fixed bar WITHOUT navigating (drop 2's split).
        before = page.url
        await play_row(page, ".new-songs__column .list-item")
        await bar_settled(page)
        await freeze_media(page)
        if page.url != before:
            raise SystemExit(f"album art NAVIGATED ({before} -> {page.url}); it must preview in place")
        await fixed("05_home_preview_bar.png", [".song-bar"],
                    "Album art previews in the fixed bar — no navigation")

        # Share entry point (S9 owns the dialog itself — one boundary shot).
        await js_click(page, '.new-songs__column [aria-label^="Share"]')
        await page.wait_for_selector('input[aria-label="Share link"]', timeout=5000)
        await page.wait_for_timeout(500)
        await fixed("06_home_share_entry.png", ['input[aria-label="Share link"]'],
                    "Shared public link — S9 owns this dialog")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # ══ P2 — Explore MVs ════════════════════════════════════════════════
        await page.goto(f"{base}/explore/mvs", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await freeze_media(page)
        counts = await page.evaluate(
            """() => [...document.querySelectorAll('.mv-detail__grid-section')]
                 .map(s => s.querySelectorAll('a[href*="/watch?id="]').length)""")
        print("   /explore/mvs cards per section:", counts)
        if sum(counts) != 14 or counts != [3, 11]:
            raise SystemExit(
                f"/explore/mvs rendered {counts}, expected [3, 11] — all 14 seed items, "
                "uncapped (A19 / the §3.2 'item count is not a rule' correction)")
        await multi_focus(cap, page, "09_explore_mvs_sections.png", [
            ([".mv-detail__grid-section--primary"], "Top Picks — TRENDING_MVS", "info"),
            ([".mv-detail__grid-section:not(.mv-detail__grid-section--primary)"],
             "Newly Released — NEW_MVS", "info"),
        ])
        hrefs = await page.evaluate(
            """() => [...document.querySelectorAll('.mv-detail__grid-section a[href*="/watch?id="]')]
                 .slice(0, 3).map(a => a.getAttribute('href'))""")
        print("   card hrefs:", hrefs)
        await shoot("10_explore_mvs_card.png",
                    ['.mv-detail__grid-section--primary a[href*="/watch?id="] >> nth=0'],
                    "Every card is a real link to /watch?id=")

        # ══ P3 — Explore Songs ══════════════════════════════════════════════
        await page.goto(f"{base}/explore/songs", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        tabs = await page.evaluate(
            """() => [...document.querySelectorAll('.tabs__tab')].map(t => t.textContent.trim())""")
        print("   /explore/songs tabs:", tabs)
        expected = ["All", "Pop", "Hip-Hop", "R&B", "Rock", "Jazz",
                    "Electronic", "Rap", "Classical", "Country"]
        if tabs != expected:
            raise SystemExit(f"genre tab bar is {tabs}, expected {expected}")
        await multi_focus(cap, page, "11_explore_songs_all.png", [
            ([".song-detail-page__list-heading .tabs"], "All + the nine creation genres", "action"),
            ([".top-picks"], "Top Picks Songs rail", "info"),
        ])

        # Start something playing FIRST, so "switching a tab must not change what
        # is playing" is tested against a real playing track rather than silence.
        await play_row(page)
        await bar_settled(page)
        await freeze_media(page)
        playing_before = await page.evaluate(
            "() => (document.querySelector('.song-bar__title') || {}).textContent")
        n_all = await page.locator(".song-detail__list-item").count()
        await js_click_text(page, "button", "Hip-Hop", ".song-detail-page__list-heading")
        await page.wait_for_timeout(700)
        n_hh = await page.locator(".song-detail__list-item").count()
        playing_after = await page.evaluate(
            "() => (document.querySelector('.song-bar__title') || {}).textContent")
        print(f"   All={n_all} rows, Hip-Hop={n_hh} rows; playing {playing_before!r} -> {playing_after!r}")
        if n_hh == 0 or n_hh >= n_all:
            raise SystemExit(f"Hip-Hop tab filtered to {n_hh} of {n_all} — expected a non-empty subset")
        if playing_before != playing_after:
            raise SystemExit("switching a browse tab CHANGED what is playing (guarded rule)")
        # Viewport shot, not full-page: `.song-bar` is `position: fixed`, and a
        # full-page capture's artificially tall viewport would move it. The frames
        # therefore have to be on elements ABOVE the fold — the filtered row count
        # is asserted above instead of framed.
        await multi_focus(cap, page, "12_explore_songs_genre_tab.png", [
            ([".song-detail-page__list-heading .tabs"], "Hip-Hop is the active tab", "action"),
            ([".song-bar__meta"], "…and what is playing is untouched", "info"),
        ], full_page=False)

        await js_click_text(page, "button", "All", ".song-detail-page__list-heading")
        await page.wait_for_timeout(600)
        await freeze_media(page)
        await fixed("13_explore_songs_preview.png", [".song-bar__transport"],
                    "Preview transport — browsing continues underneath")

        # AC-EXP-03's OTHER half: the row's TITLE navigates, at 768px and above,
        # to the result-stage player. The album art (13, above) does not — the
        # two affordances split in DP drop 2 and both have to be photographed or
        # the criterion is only half covered.
        await page.evaluate(
            """() => { const r = document.querySelector('.song-detail__list-item .top-song');
                 if (r) r.click(); }""")
        await page.wait_for_url("**/song/result*", timeout=10000)
        await page.wait_for_timeout(1600)
        await freeze_media(page)
        print("   row title navigated to:", page.url)
        if "from=song-detail" not in page.url:
            raise SystemExit(f"row title did not carry from=song-detail: {page.url}")
        await shoot("14_explore_songs_row_navigates.png", ["main"],
                    "Arrives on the result-stage player — S1 owns this screen", kind="info")

        # AC-EXP-02: Create seeds SongCompose and leaves for /song/create.
        await page.goto(f"{base}/explore/songs", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        await js_click_text(page, "span", "Create", ".song-detail__list-item")
        await page.wait_for_url("**/song/create", timeout=10000)
        await page.wait_for_timeout(1600)
        await freeze_media(page)
        await shoot("15_explore_songs_create.png", ["main"],
                    "Arrives on /song/create pre-filled — S1 owns this screen", kind="info")

        # ══ P5 — Song play (community) ══════════════════════════════════════
        # ARRIVAL. Desktop `/song/play?id=` renders the SAME browse screen, and
        # the bar stays CLOSED: `previewOpen` starts false and only a play
        # control opens it. Nothing on screen marks which song the link named —
        # captured as-is and raised as an open question.
        await page.goto(f"{base}/song/play?id=sp-pop-anthem", wait_until="networkidle")
        await page.wait_for_timeout(1400)
        await freeze_media(page)
        await bar_settled(page, want_open=False)
        marked = await page.evaluate(
            """() => [...document.querySelectorAll('.song-detail__list-item')]
                 .filter(e => /--active|--selected|--playing/.test(e.innerHTML)).length""")
        print("   /song/play arrival: bar closed, rows marked as the linked song =", marked)
        await shoot("26_songplay_arrival.png", [".song-detail__list"],
                    "The same browse list — the bar is mounted but closed", kind="info")

        await play_row(page)
        await bar_settled(page)
        await freeze_media(page)
        active = (await page.locator(".song-bar__title").inner_text()).strip()
        print("   after Play, bar shows:", active)
        if active != "Pop Anthem":
            raise SystemExit(f"?id did not become the active track (got {active!r})")
        await fixed("27_songplay_bar_open.png", [".song-bar"],
                    "Play opens the bar on the linked track")

        # EXP-09: a `cps-*` id switches the LIST to the creator playlist and
        # leaves no tab marked active.
        await page.goto(f"{base}/song/play?id=cps-golden-hour", wait_until="networkidle")
        await page.wait_for_timeout(1400)
        await freeze_media(page)
        n_creator = await page.locator(".song-detail__list-item").count()
        n_active_tab = await page.locator(
            ".tabs__tab--active, .tabs__tab[aria-selected='true']").count()
        print(f"   creator playlist rows={n_creator}, active tabs={n_active_tab}")
        if n_creator != 8:
            raise SystemExit(f"creator playlist showed {n_creator} rows, expected 8 CREATOR_SONGS")
        if n_active_tab != 0:
            raise SystemExit("a genre tab was marked active while the creator playlist drives the list")
        await multi_focus(cap, page, "28_songplay_creator_playlist.png", [
            ([".song-detail__list"], "The playlist follows the song — 8 creator tracks", "info"),
            ([".song-detail-page__list-heading .tabs"], "No tab is active", "info"),
        ])

        # EXP-E1b / AC-EXP-09 — an unresolvable id is a not-found state.
        await page.goto(f"{base}/song/play?id=does-not-exist", wait_until="networkidle")
        await page.wait_for_timeout(900)
        await shoot("29_songplay_notfound.png", ["text=Explore Songs"],
                    "Not found — an Explore CTA, never a silent fallback")

        print("Session A console errors:", cap.errors or "none")


# ── Session B: signed in — P4 (/watch) alone ────────────────────────────────
async def main_watch(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        fixed = make_shoot(cap, page, full_page=False)

        # P4 — the player itself, on a USER-SUBMITTED MV (no watermark).
        await page.goto(f"{base}/watch?id=mv-cinematic-dark", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await freeze_media(page)
        if await page.locator(".mv-player__watermark").count() != 0:
            raise SystemExit("a user-submitted MV rendered the YCM watermark (AC-EXP-10)")
        if await page.locator(".mv-player__video").count() != 3:
            raise SystemExit("expected the 3-slot swipe track on an MV_LIST id")
        await multi_focus(cap, page, "16_watch_player.png", [
            ([".mv-player__meta-row"], "Title, creator, Like / Share, Create MV", "info"),
            ([".mv-player__controls"], "Transport — play/pause, seek, mute, fullscreen", "info"),
        ], full_page=False)

        below = await page.locator(".mv-detail__grid-section").count()
        if below != 2:
            raise SystemExit(f"/watch showed {below} grid sections below the player, expected 2")
        await shoot("17_watch_grid_below.png", [".mv-detail__grid-section--primary"],
                    "The same two sections /explore/mvs shows", kind="info")

        # AC-EXP-10 — the official/YCM watermark.
        await page.goto(f"{base}/watch?id=hero-vintage-drive", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await freeze_media(page)
        creator = (await page.locator(".mv-player__username").inner_text()).strip()
        slots = await page.locator(".mv-player__video").count()
        print(f"   official MV creator={creator!r}, video slots={slots}")
        if creator != "YouCam Muse":
            raise SystemExit(f"expected the official creator, got {creator!r}")
        if slots != 1:
            raise SystemExit(
                f"a HERO_MVS id rendered {slots} slots — it must fall back to the "
                "single-video path, since HERO_MVS is excluded from MV_LIST")
        geom = await page.evaluate(
            """() => { const w = document.querySelector('.mv-player__watermark');
                       const v = document.querySelector('.mv-player__video');
                       if (!w || !v) return null;
                       const a = w.getBoundingClientRect(), b = v.getBoundingClientRect();
                       return { inside: a.left >= b.left - 1 && a.top >= b.top - 1
                                        && a.right <= b.right + 1 && a.bottom <= b.bottom + 1,
                                h: Math.round(a.height) }; }""")
        print("   watermark geometry:", geom)
        if not geom or not geom["inside"]:
            raise SystemExit("the watermark is not inside the video's own rendered rect (AC-EXP-10)")
        await fixed("18_watch_watermark_official.png", [".mv-player__watermark"],
                    "YCM watermark — official videos only")

        # AC-EXP-11 — the vertical swipe, exercised for real.
        await page.goto(f"{base}/watch?id=trend-adventurous-echoes", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await freeze_media(page)
        start = (await page.locator(".mv-player__title").inner_text()).strip()
        stage = await page.locator(".mv-player__stage").bounding_box()
        threshold = stage["height"] * 80 / 693
        print(f"   swipe: start={start!r} stage_h={stage['height']:.1f} threshold={threshold:.1f}px")

        await drag_stage(page, -int(stage["height"] * 0.35), release=False)
        transform = await page.evaluate(
            """() => { const t = document.querySelector('.mv-player__stage').firstElementChild;
                       return t ? getComputedStyle(t).transform : null }""")
        print("   mid-drag transform:", transform)
        if not transform or transform == "none":
            raise SystemExit("the stage track did not translate during a drag")
        await fixed("19_watch_swipe_dragging.png", [".mv-player__stage"],
                    "Held past the threshold — the next MV peeks in")
        await page.mouse.up()
        await page.wait_for_timeout(1100)
        after = (await page.locator(".mv-player__title").inner_text()).strip()
        print(f"   committed: {start!r} -> {after!r}  url={page.url}")
        if after == start or "trend-thrilling-harmonies" not in page.url:
            raise SystemExit(f"swipe did not commit ({start!r} -> {after!r}, url {page.url})")
        await freeze_media(page)
        await fixed("20_watch_swipe_committed.png", [".mv-player__title"],
                    "Committed to the next MV; the URL is replaced, not pushed")

        # Below threshold: springs back, nothing changes. No screenshot — the
        # screen is pixel-identical to 18 once it has sprung back.
        url_before = page.url
        await drag_stage(page, -12, steps=4)
        await page.wait_for_timeout(800)
        if (await page.locator(".mv-player__title").inner_text()).strip() != after \
                or page.url != url_before:
            raise SystemExit("a below-threshold drag changed the current MV")
        print("   below-threshold drag sprang back, unchanged (verified, no shot)")

        # An id outside MV_LIST never commits, however far it is dragged.
        await page.goto(f"{base}/watch?id=cp-cinematic-night", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await freeze_media(page)
        slots = await page.locator(".mv-player__video").count()
        title = (await page.locator(".mv-player__title").inner_text()).strip()
        if slots != 1:
            raise SystemExit(f"a CREATOR_MVS id rendered {slots} slots, expected the 1-video fallback")
        await drag_stage(page, -int(stage["height"] * 0.5))
        await page.wait_for_timeout(1000)
        if (await page.locator(".mv-player__title").inner_text()).strip() != title:
            raise SystemExit("an id outside MV_LIST committed a swipe")
        print(f"   {title!r} (a /creator id): 1 slot, drag is a no-op — verified")
        await fixed("21_watch_no_neighbour.png", [".mv-player__stage"],
                    "An id outside the feed: one video, and the drag never commits", kind="info")

        # Create Music Video seeds the compose and leaves for /mv/room.
        await page.goto(f"{base}/watch?id=mv-cinematic-dark", wait_until="networkidle")
        await page.wait_for_timeout(1400)
        await freeze_media(page)
        await js_click(page, ".mv-player__cta")
        await page.wait_for_url("**/mv/room", timeout=10000)
        await page.wait_for_timeout(1600)
        await freeze_media(page)
        await shoot("24_watch_create_prefilled.png", ["main, .mv-room"],
                    "Arrives on /mv/room pre-filled — S2 owns this screen", kind="info")

        # EXP-E1b — an unresolvable /watch id.
        await page.goto(f"{base}/watch?id=does-not-exist", wait_until="networkidle")
        await page.wait_for_timeout(900)
        await shoot("25_watch_notfound.png", ["text=Explore Music Videos"],
                    "Not found — an Explore CTA, never a silent fallback")

        print("Session B console errors:", cap.errors or "none")


# ── Session C: NOT signed in — the requireLogin gates ───────────────────────
async def main_guest(base):
    async with NextCapture(HERE, base, seed_auth=False) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        fixed = make_shoot(cap, page, full_page=False)

        # The screen itself is public — nothing is gated until an action.
        await page.goto(f"{base}/", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        # `.login-modal`, not any `[role="dialog"]` — `MobileTabBar`'s always-mounted
        # create sheet is also a dialog and computes visible at desktop width, so
        # the broad selector answers "yes" on a screen with no modal at all.
        if await page.locator(".login-modal").count():
            raise SystemExit("a sign-in modal was open on a logged-out home load — this route is public")
        await shoot("07_guest_home_public.png", [".new-mvs"],
                    "Public — the feed renders in full with nobody signed in", kind="info")

        # AC-EXP-02 / AC-EXP-08 — the gate is at the ACTION, not the route.
        before = page.url
        await js_click(page, ".tool-selector-v3__row > *")
        await page.wait_for_selector(".login-modal--sign-in", state="visible", timeout=8000)
        await page.wait_for_timeout(600)
        if "/mv/room" in page.url:
            raise SystemExit("the gated card navigated anyway while logged out")
        await fixed("08_guest_toolcard_gated.png", [".login-modal--sign-in"],
                    "Sign-in opens at the click — S6 owns this modal")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(600)

        # A community Like is gated the same way; Share is NOT.
        await page.goto(f"{base}/watch?id=mv-cinematic-dark", wait_until="networkidle")
        await page.wait_for_timeout(1400)
        await freeze_media(page)
        await js_click(page, '.mv-player__like-share [aria-label="Like"]')
        await page.wait_for_selector(".login-modal--sign-in", state="visible", timeout=8000)
        await page.wait_for_timeout(600)
        await fixed("22_guest_like_gated.png", [".login-modal--sign-in"],
                    "Like gates at the action too (GL-02)")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(700)
        await js_click(page, '.mv-player__like-share [aria-label="Share"]')
        await page.wait_for_selector('input[aria-label="Share link"]', timeout=6000)
        await page.wait_for_timeout(500)
        await fixed("23_guest_share_ungated.png", ['input[aria-label="Share link"]'],
                    "Share stays ungated — no sign-in for a public link")

        print("Session C console errors:", cap.errors or "none")


# ── Session D: signed in + ?demo=1 — P6 (/creator), incl. profileEmpty ──────
async def main_demo(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        fixed = make_shoot(cap, page, full_page=False)

        # P6 — someone ELSE's profile.
        await page.goto(f"{base}/creator", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        name = (await page.locator(".community-profile h1").inner_text()).strip()
        emails = await page.locator(".community-profile__identity :text('@')").count()
        print(f"   other-profile name={name!r} email elements={emails}")
        await multi_focus(cap, page, "30_creator_other_mv.png", [
            ([".community-profile__summary"], "Name + Plays / Likes — no email", "info"),
            ([".community-profile__main .tabs"], "Music Videos / Songs", "action"),
        ])

        # A visitor gets Like + Share INLINE, and no owner menu at all.
        more = await page.locator('.community-profile__list [aria-label="More"]').count()
        like = await page.locator('.community-profile__list [aria-label="Like"], '
                                  '.community-profile__list [aria-label="Unlike"]').count()
        row_tags = await page.evaluate(
            """() => [...document.querySelector('.community-profile__list').children]
                 .slice(0, 2).map(e => e.tagName + '.' + e.className)""")
        print(f"   visitor row actions: More={more} Like={like}; row markup={row_tags}")
        if more != 0:
            raise SystemExit(
                f"a visitor saw {more} owner menus — `ownerMenu = self && loggedIn`, "
                "so someone else's profile has none")
        if like == 0:
            raise SystemExit("a visitor's rows carried no Like control")
        await shoot("31_creator_other_actions.png",
                    ['.community-profile__list > * >> nth=0'],
                    "Like and Share only — no owner menu on someone else's page", kind="info")

        # Your OWN profile: MOCK_USER identity, sample stats + content.
        await page.goto(f"{base}/creator?self=1", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        self_name = (await page.locator(".community-profile h1").inner_text()).strip()
        stats = await page.evaluate(
            """() => [...document.querySelectorAll('.community-profile__stats strong')]
                 .map(e => e.textContent.trim())""")
        print(f"   self name={self_name!r} stats={stats}")
        await multi_focus(cap, page, "32_creator_self.png", [
            ([".community-profile__identity"], "The signed-in user's own identity", "info"),
            ([".community-profile__stats"], "The sample creator's stats, even in self mode", "info"),
        ])

        # The owner menu. SIX rows on both tabs, but the FIRST one differs by
        # kind — measured here rather than assumed, because area 04 records it as
        # a flat "Edit · Like · Share · Publish · Download · Delete" on both.
        async def menu_rows():
            # Scroll the row to the top FIRST. The menu is portalled and its
            # `position: fixed` coordinates are computed from the trigger's rect
            # at open time, so a trigger low in a 697px-tall viewport puts the
            # 276px menu partly off-screen. Centring the TRIGGER leaves room for
            # the menu to open downward. It also closes on scroll, so this cannot
            # be done after opening it.
            await page.evaluate(
                """() => { const b = document.querySelector(
                     '.community-profile__list [aria-label="More"]');
                     if (b) b.scrollIntoView({ block: 'center' }); }""")
            await page.wait_for_timeout(500)
            await js_click(page, '.community-profile__list [aria-label="More"]')
            await page.wait_for_selector(".history-card__menu--visible", timeout=5000)
            await page.wait_for_timeout(500)
            return await page.evaluate(
                """() => [...document.querySelector('.history-card__menu--visible').children]
                     .map(e => e.textContent.trim()).filter(Boolean)""")

        mv_items = await menu_rows()
        print("   owner menu (MV row):", mv_items)
        if mv_items != ["Edit MV", "Like", "Share", "Publish", "Download", "Delete"]:
            raise SystemExit(f"unexpected MV owner menu: {mv_items}")
        await fixed("33_creator_self_menu.png", [".history-card__menu--visible"],
                    "The owner menu on an MV row — wired to History's implementations")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        await page.goto(f"{base}/creator?self=1&tab=songs", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        song_items = await menu_rows()
        print("   owner menu (song row):", song_items)
        if song_items != ["Create MV", "Like", "Share", "Publish", "Download", "Delete"]:
            raise SystemExit(f"unexpected song owner menu: {song_items}")
        await fixed("34_creator_self_menu_song.png", [".history-card__menu--visible"],
                    "The same six slots on a song row — Edit MV becomes Create MV")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # EXP-E6 / AC-EXP-12 — the only route to the empty state.
        await page.goto(f"{base}/creator?self=1&tab=mv&demo=1", wait_until="networkidle")
        await page.wait_for_timeout(1100)
        await open_demo_panel(page)
        await toggle_flag(page, "Community profile — no MVs / Songs", True)
        await collapse_demo_panel(page)
        await page.wait_for_timeout(600)
        cta = await page.locator(".history-page__empty-cta").count()
        sub = await page.locator(".history-page__empty-subtitle").count()
        print(f"   self empty: subtitle={sub} cta={cta}")
        if not (cta == 1 and sub == 1):
            raise SystemExit("the self empty state is missing its subtitle or CTA (AC-EXP-12)")
        await multi_focus(cap, page, "35_creator_empty_self.png", [
            ([".history-page__empty-title"], "No works released yet", "info"),
            ([".history-page__empty-cta"], "Tab-specific CTA — self only", "action"),
        ])

        await page.goto(f"{base}/creator?demo=1", wait_until="networkidle")
        await page.wait_for_timeout(1100)
        cta = await page.locator(".history-page__empty-cta").count()
        sub = await page.locator(".history-page__empty-subtitle").count()
        print(f"   other empty: subtitle={sub} cta={cta}")
        if cta or sub:
            raise SystemExit(
                "someone else's empty profile showed a subtitle or a Create CTA — "
                "it must show the title alone (AC-EXP-12)")
        await shoot("36_creator_empty_other.png", [".community-profile__empty"],
                    "The same block minus the subtitle and CTA", kind="info")

        print("Session D console errors:", cap.errors or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--only", default="", help="comma-separated: public,watch,guest,demo")
    args = ap.parse_args()
    only = [s for s in args.only.split(",") if s]
    runs = {"public": main_public, "watch": main_watch,
            "guest": main_guest, "demo": main_demo}
    for key, fn in runs.items():
        if only and key not in only:
            continue
        print(f"\n═══ session: {key} ═══")
        asyncio.run(fn(args.base))
