#!/usr/bin/env python3
"""Capture the AI MV Creation screenshots AND measure every focus box.

RE-RUN, 2026-08-27. Capture run 1's 44 screenshots were voided (PLAN.md §2 "S2
scope" note) because they photographed `/mv/room`'s Enhance button, which
`origin/main`'s `3bdff87` removed for V1 the day after that run captured (product
owner, 2026-08-25). The branch has since been rebased onto `origin/main`, so this
run drops Enhance from P2 entirely and re-shoots every path against the current
tree — nothing from run 1 is reused, including its filenames (P2 loses one shot,
so everything downstream is renumbered, not left with a gap).

Pattern copied from ../song-creation/capture_screenshots.py (see that file's
header for why `NextCapture` overrides only the lifecycle, and why focus boxes
are measured live rather than hand-estimated).

SCREENSHOT SOURCE: the live app, not a static prototype — there is no separate
prototype build in this repo. Every PNG here comes from driving the real
Next.js dev server with Playwright, signed in via the same
`localStorage['muse_auth']` seed the e2e specs use. Viewport 1440x900 (D8).

CREDITS — TWO SERVER PROCESSES, ON PURPOSE
    `DEFAULT_CREDITS` is 10 and MV's cheapest possible generation
    (`scriptCost`, Create Storyboard First on the shortest song) is already
    well above that — so under the repo's ordinary default env, EVERY MV
    generation attempt is naturally insufficient-credit. That is exactly P6's
    scenario, so P6 is captured against a dev server with NO
    `NEXT_PUBLIC_DEMO_CREDITS` override (the plain default). Every other path
    needs an actual generation to succeed, so P1/P2/P3/P4/P7/P8 are captured
    against a SECOND dev server started with `NEXT_PUBLIC_DEMO_CREDITS=2000`
    (comfortably above the ~500 credit ceiling one full
    storyboard-first-then-generate flow costs, and still short of ever
    exceeding the platform's own maximum single-render cost so it can't
    accidentally short-circuit into the P6 state).
    `NEXT_PUBLIC_DEMO_CREDITS` is a build-time-inlined env var, so switching it
    means restarting the dev server — see the two `--base`/`--credits-gate`
    invocations in the USAGE block below.

USAGE
    NEXT_PUBLIC_DEMO_CREDITS=2000 npm run dev -- -p 3010     # terminal 1
    python3 capture_screenshots.py --base http://localhost:3010
    # then restart the dev server with NO override (plain `npm run dev -- -p 3010`) and:
    python3 capture_screenshots.py --base http://localhost:3010 --credits-gate-only
    python3 build_spec.py

VIEWPORT
    1440x900 (full page, not element-scoped) — matches every focus box
    percentage recorded in specs/focus.json.
"""
import argparse
import asyncio
import os
import sys
import tempfile

SCRATCH_DIR = tempfile.gettempdir()


def _write_silent_wav(path, seconds, rate=8000):
    """A real, decodable WAV of a chosen length.

    The upload-time duration guard reads `duration` off an <audio> element, so
    it can only be demonstrated with a file the browser actually decodes — a
    named buffer of zeros gives NaN and is let through on purpose. Silence at
    8 kHz mono keeps a 6-second clip under 100 KB.
    """
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b"\x00\x00" * int(rate * seconds))

HERE = os.path.dirname(os.path.abspath(__file__))
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(WEB_APP, "skills", "yco-spec"))

_SHARED = os.path.expanduser("~/Library/Caches/ms-playwright")
if "PLAYWRIGHT_BROWSERS_PATH" not in os.environ and os.path.isdir(_SHARED):
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = _SHARED

from capture_lib import Capture, chromium_path  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

VIEWPORT = (1440, 900)

DESCRIPTION = (
    "A cinematic music video with warm golden-hour lighting, slow tracking "
    "shots through a sunlit wheat field, and a wide-open sky."
)
FAIL_DESCRIPTION = "A glitchy synthwave night drive that falls apart halfway through [fail]"
LONG_DESCRIPTION = "A" * 2600  # for the 2500-char cap live check (no screenshot)

FACE_IMAGE = os.path.join(
    WEB_APP, "public", "assets", "images", "character-photos", "samples", "Sample_P1.jpg"
)

CTA = ".mv-create__cta:visible"
DESC_BOX = ".mv-create__textarea"
TEMPLATES_BTN = ".mv-create__idea-btn"
SETTINGS_BTN = ".mv-create__settings"
SONG_LIBRARY_BTN = ".mv-create__song-option:nth-child(1)"
IMPORT_AUDIO_BTN = ".mv-create__song-option:nth-child(2)"
AUDIO_INPUT = 'input.mv-create__file-input[accept="audio/*"]'
PHOTO_INPUT = 'input.mv-create__file-input[accept="image/*"]'


class NextCapture(Capture):
    """`Capture` against an already-running Next dev server (see song-creation's
    identical override for why the lifecycle, and only the lifecycle, changes)."""

    def __init__(self, feature_dir, base_url, **kw):
        kw.setdefault("viewport", VIEWPORT)
        super().__init__(feature_dir, "", **kw)
        self.base_url = base_url.rstrip("/")

    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            executable_path=chromium_path(),
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await self._browser.new_context(
            viewport=self.viewport, device_scale_factor=1)
        await ctx.add_init_script("window.localStorage.setItem('muse_auth', '1')")
        self.page = await ctx.new_page()
        self.page.on("console", lambda m: self.errors.append(m.text)
                     if m.type == "error" else None)
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        return self

    async def __aexit__(self, *a):
        self._server = None
        return await super().__aexit__(*a)


class GuestNextCapture(NextCapture):
    """Same as NextCapture but WITHOUT the muse_auth seed — for P5's guest gate."""

    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            executable_path=chromium_path(),
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await self._browser.new_context(
            viewport=self.viewport, device_scale_factor=1)
        self.page = await ctx.new_page()
        self.page.on("console", lambda m: self.errors.append(m.text)
                     if m.type == "error" else None)
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        return self


async def check(page, targets):
    """Same guard as song-creation's capture script — fail loudly rather than
    silently drawing a frame in the wrong place."""
    for sel in targets:
        n = await page.locator(sel).count()
        if n == 0:
            raise SystemExit(f"focus selector matched nothing: {sel}")


async def shoot(cap, name, targets=None, label=None, kind="action"):
    page = cap.page
    await page.wait_for_timeout(250)
    if targets:
        await check(page, targets)
    cb = await cap.shot(name)
    if targets:
        await cap.focus(name, cb, targets, label, kind=kind)
        got = cap.focus_map[name][-1]["box"]
        x, y, w, h = got
        if not (0 <= x < 100 and 0 <= y < 100 and 0 < w <= 100 and 0 < h <= 100
                and x + w <= 101 and y + h <= 101):
            raise SystemExit(f"{name}: focus box {got} is outside its own screenshot")


async def freeze_video(page, selector="video"):
    """Pause every <video> and seek to a fixed frame before a shot — required
    by the capture brief (autoplaying frames are not reproducible run to run)."""
    await page.evaluate(
        """(sel) => {
            document.querySelectorAll(sel).forEach(v => {
                try { v.pause(); v.currentTime = 0.5; } catch (e) {}
            });
        }""",
        selector,
    )
    await page.wait_for_timeout(200)


async def open_choose_song(page):
    """Open ChooseSongModal regardless of whether `/mv/room` is in its EMPTY
    state (`.mv-create__song-option` — Song Library / Import Audio) or its
    ALREADY-ADDED state (`.mv-create__song-added-label`, when compose.song
    survived from an earlier client-side-navigated step in this same run —
    e.g. P2 continuing from P1, or P8 continuing from P7). Clicking the wrong
    one for the current state finds nothing: the two markups are mutually
    exclusive."""
    if await page.locator(".mv-create__song-added-label").count() > 0:
        await page.click(".mv-create__song-added-label")
    else:
        await page.click(SONG_LIBRARY_BTN)
    await page.wait_for_selector(".mv-song-picker__row", state="visible")


async def pick_song(page, tab, index, use_label="Use"):
    """Open Choose Song (assumes it's already open), switch tab, click the
    Nth row's Use pill. Leaves the Trim sheet open.

    `.mv-song-picker__use` ships `opacity: 0; pointer-events: none` until its
    row is `--active` (see ChooseSongModal.tsx's own header note) — a plain
    row click first (which sets `activeId` and starts the preview) is what
    reveals the pill for a real click, exactly as a mouse user would do it.
    """
    if tab == "sample":
        await page.click(".mv-song-picker__tab:nth-child(2)")
        await page.wait_for_timeout(300)
    row = page.locator(".mv-song-picker__row").nth(index)
    await row.click()
    await page.wait_for_timeout(200)
    await row.locator(".mv-song-picker__use").click()
    await page.wait_for_selector(".mv-trim-sheet__trimmer", state="visible")
    await page.wait_for_timeout(400)


async def confirm_trim(page):
    await page.click(".mv-sheet__footer-btn--confirm")
    await page.wait_for_timeout(400)


async def fill_description(page, text):
    await page.fill(DESC_BOX, text)
    await page.wait_for_timeout(150)


async def add_sample_photo(page, index=0):
    await page.locator(".mv-create__sample").nth(index).click()
    await page.wait_for_timeout(200)


async def open_mode_modal(page):
    await page.click(CTA)
    await page.wait_for_selector(".mv-mode-sheet__intro", state="visible")
    await page.wait_for_timeout(300)


async def wait_generation_done(page, next_url_fragment, timeout=90000):
    await page.wait_for_url(f"**{next_url_fragment}**", timeout=timeout)
    await page.wait_for_timeout(500)


async def goto_history(page):
    """Client-side navigation to /history via the sidebar link — NOT
    `page.goto()`. History (and credits, and compose) are in-memory-only
    React state, so a real page load (`page.goto`) remounts every provider
    from scratch and silently erases whatever this run just generated. The
    sidebar `<Link>` does a Next.js client transition instead, which keeps
    the SPA instance (and its state) alive."""
    await page.click('.sidebar__nav-item[href="/history"]')
    await page.wait_for_url("**/history**")
    await page.wait_for_timeout(700)


async def goto_room_client(page):
    """Client-side navigation to /mv/room via the sidebar — same reasoning
    as `goto_history`: used where the caller wants compose/History state to
    SURVIVE the hop (contrast with the `go()` closure in each path's own
    scope, which is a real `page.goto()` used deliberately to reset state
    for a new independent path)."""
    await page.click('.sidebar__nav-item[href="/mv/room"]')
    await page.wait_for_url("**/mv/room**")
    await page.wait_for_timeout(500)


async def wait_generation_failed(page, timeout=20000):
    await page.wait_for_selector(
        ".mv-storyboard-processing__title:has-text('Generation Failed')",
        state="visible", timeout=timeout,
    )
    await page.wait_for_timeout(300)


async def main_hi_credit(base):
    """P1, P2, P3, P4, P7, P8 — everything that needs a generation to actually
    succeed, against the NEXT_PUBLIC_DEMO_CREDITS=2000 server."""
    async with NextCapture(HERE, base) as cap:
        page = cap.page

        async def go(path):
            await page.goto(f"{base}{path}", wait_until="networkidle")
            await page.wait_for_timeout(700)

        # ══════════════════════════════════════════════════════════════════
        # P1 · Storyboard-first, end to end
        # ══════════════════════════════════════════════════════════════════
        await go("/mv/room")
        await shoot(cap, "01_mv_room_empty.png")

        # MV-P1-S2: tap "Sing & Story" (3rd type card — displays "Sing & Story",
        # id stays "hybrid")
        await page.locator(".mv-create__style-card").nth(2).click()
        await page.wait_for_timeout(200)
        await shoot(cap, "02_mv_type_selected.png",
                    [".mv-create__style-card:nth-child(3)"], "Sing &amp; Story")

        # MV-P1-S3: Choose Song -> My Songs -> "My Wedding Ballad" (index 0)
        await open_choose_song(page)
        await page.wait_for_timeout(300)
        # Hover reveals `.mv-song-picker__use`, which is opacity:0 at rest.
        await page.locator(".mv-song-picker__row").nth(0).hover()
        await page.wait_for_timeout(200)
        await shoot(cap, "03_choose_song_modal.png",
                    [".mv-song-picker__row:nth-child(1) .mv-song-picker__use"], "Use")
        await pick_song(page, "my", 0)
        await shoot(cap, "04_trim_audio_default.png", [".mv-sheet__footer-btn--confirm"], "Confirm")
        await confirm_trim(page)
        await shoot(cap, "05_song_added.png")

        # MV-P1-S4: description
        await fill_description(page, DESCRIPTION)
        await shoot(cap, "06_description_filled.png")

        # live check only, no screenshot: AC-MV-03's 2500-char cap via a REAL
        # fill event (matches song-creation's methodology — a programmatic
        # value assignment bypasses maxLength, a fill() event does not).
        await page.fill(DESC_BOX, LONG_DESCRIPTION)
        capped = await page.eval_on_selector(DESC_BOX, "el => el.value.length")
        if capped != 2500:
            raise SystemExit(f"AC-MV-03 live check failed: description length={capped}, want 2500")
        await fill_description(page, DESCRIPTION)

        # MV-P1-S5: character photo via Sample Photos (skips the consent
        # dialog + FacePicker crop, which P4 covers on its own)
        await add_sample_photo(page, 0)
        await shoot(cap, "07_photo_sample_added.png", [".mv-create__sample"], "Sample photo")

        # MV-P1-S7: CTA ready
        await shoot(cap, "08_create_cta_ready.png", [CTA], "Create Music Video")

        # MV-P2-S1: Mode sheet, storyboard-first
        await open_mode_modal(page)
        await shoot(cap, "09_mode_modal_storyboard.png",
                    [".mv-mode-card--featured"], "Create Storyboard First")
        await page.click(".mv-mode-card--featured")
        await wait_generation_done(page, "/mv/thinking")

        # MV-P2-S2: /mv/thinking progress
        await shoot(cap, "10_mv_thinking_progress.png")
        await wait_generation_done(page, "/mv/storyboard", timeout=15000)

        # MV-P2-S3: /mv/storyboard editor
        await shoot(cap, "11_mv_storyboard_editor.png")

        # MV-P2-S4: Generate MV — this page is tall enough that the CTA can
        # sit below the fold even though FloatingCTA is `adaptive`; scroll it
        # into view before measuring/shooting rather than trusting the float.
        await page.locator(".mv-storyboard__cta:visible").scroll_into_view_if_needed()
        await page.wait_for_timeout(300)
        await shoot(cap, "12_mv_storyboard_generate.png", [".mv-storyboard__cta:visible"], "Generate MV")
        await page.click(".mv-storyboard__cta:visible")
        await wait_generation_done(page, "/mv/creating")

        # MV-P3-S2: /mv/creating (shared GenerationView)
        await shoot(cap, "13_mv_creating_progress.png")
        await wait_generation_done(page, "/mv/result", timeout=20000)

        # MV-P4-S1..S3: /mv/result
        await freeze_video(page)
        await shoot(cap, "14_mv_result_storyboard_first.png")

        # MV-P1-S8 (closing step): History shows the new row
        await goto_history(page)
        await shoot(cap, "15_history_new_mv_row.png")

        # ══════════════════════════════════════════════════════════════════
        # P2 · Direct generation — TEMPLATES ONLY.
        # Enhance is NOT part of this path (PLAN.md §2 S2 scope) — it was
        # removed from /mv/room for V1 (product owner, 2026-08-25, 3bdff87)
        # and must not appear anywhere here. Client-nav from P1's /history
        # (not `go()`/`page.goto`) so History keeps P1's row — the closing
        # shot below needs BOTH rows present.
        # ══════════════════════════════════════════════════════════════════
        await goto_room_client(page)
        await page.click(TEMPLATES_BTN)
        await page.wait_for_selector(".mv-template-sheet__list", state="visible")
        await page.wait_for_timeout(300)
        await shoot(cap, "16_templates_sheet.png", [".mv-sheet__footer-btn--confirm"], "Confirm")
        # pick the 2nd template thumbnail so the applied state is visibly
        # different from the sheet's own default selection
        await page.locator(".mv-template-sheet__item").nth(1).click()
        await page.wait_for_timeout(200)
        await page.click(".mv-sheet__footer-btn--confirm")
        await page.wait_for_timeout(300)
        await shoot(cap, "17_templates_applied.png", [TEMPLATES_BTN], "Templates")

        # song (Sample Songs tab this time, "Summer Vibes" is not in samples —
        # use My Songs index 1, "Summer Vibes", a different song than P1 used)
        await open_choose_song(page)
        await pick_song(page, "my", 1)
        await confirm_trim(page)
        await add_sample_photo(page, 1)

        await open_mode_modal(page)
        await shoot(cap, "18_mode_modal_direct.png", [".mv-mode-card:not(.mv-mode-card--featured)"],
                    "Create MV Directly")
        await page.click(".mv-mode-card:not(.mv-mode-card--featured)")
        await wait_generation_done(page, "/mv/creating")
        await wait_generation_done(page, "/mv/result", timeout=20000)

        await freeze_video(page)
        await shoot(cap, "19_mv_result_direct.png")

        await goto_history(page)
        await shoot(cap, "20_history_two_mv_rows.png")

        # ══════════════════════════════════════════════════════════════════
        # P3 · Generation failure, both stages
        # ══════════════════════════════════════════════════════════════════
        await go("/mv/room")
        await fill_description(page, FAIL_DESCRIPTION)
        await open_choose_song(page)
        await pick_song(page, "my", 0)
        await confirm_trim(page)
        await shoot(cap, "21_fail_description.png", [CTA], "Create Music Video")

        await open_mode_modal(page)
        await page.click(".mv-mode-card--featured")
        await wait_generation_done(page, "/mv/thinking")
        await wait_generation_failed(page)
        await shoot(cap, "22_thinking_failed.png")

        # direct-mode failure — fresh compose
        await go("/mv/room")
        await fill_description(page, FAIL_DESCRIPTION)
        await open_choose_song(page)
        await pick_song(page, "my", 0)
        await confirm_trim(page)
        await open_mode_modal(page)
        await page.click(".mv-mode-card:not(.mv-mode-card--featured)")
        await wait_generation_done(page, "/mv/creating")
        await wait_generation_failed(page)
        await shoot(cap, "23_creating_failed.png", [".mv-storyboard-processing__progress .button--primary"], "Retry")

        # ══════════════════════════════════════════════════════════════════
        # P4 · The six sheets and their boundaries
        # ══════════════════════════════════════════════════════════════════
        await go("/mv/room")
        await open_choose_song(page)
        await shoot(cap, "24_choose_song_sample_tab.png", [".mv-song-picker__tab:nth-child(2)"],
                    "Sample Songs")
        await page.click(".mv-song-picker__tab:nth-child(2)")
        await page.wait_for_timeout(300)
        await shoot(cap, "25_choose_song_sample_list.png")
        await page.click(".mv-sheet__close")
        await page.wait_for_timeout(300)

        # Import reject — format (in-memory buffer, no real file needed)
        await page.set_input_files(AUDIO_INPUT, [
            {"name": "notes.txt", "mimeType": "text/plain", "buffer": b"not audio"}
        ])
        await page.wait_for_selector("text=Unsupported format", state="visible")
        await shoot(cap, "26_import_reject_format.png")
        await page.wait_for_timeout(2700)  # let the toast self-dismiss (2.6s)

        # Import reject — size (>50MB, valid extension/MIME). Playwright's
        # set_input_files refuses an in-memory buffer over 50MB outright
        # ("Cannot set buffer larger than 50Mb") — exactly the boundary this
        # step needs to cross, so it has to go through a real file on disk.
        big_path = os.path.join(SCRATCH_DIR, "huge.mp3")
        with open(big_path, "wb") as f:
            f.write(b"0" * (51 * 1024 * 1024))
        await page.set_input_files(AUDIO_INPUT, big_path)
        os.remove(big_path)
        await page.wait_for_selector("text=File too large", state="visible")
        await shoot(cap, "27_import_reject_size.png")
        await page.wait_for_timeout(2700)

        # Import reject — TOO SHORT. Added 2026-09-02: the 30s floor used to be
        # enforced only inside the trim dialog, which made a 20s upload a DEAD
        # END — the dialog opened, showed "minimum 30s" in red, and kept Confirm
        # disabled forever, since a 20s track cannot be trimmed UP to 30s. The
        # floor now also runs at upload time.
        #
        # This needs a real, DECODABLE file: the check reads `duration` off an
        # <audio> element, so a fake buffer with an .mp3 name yields NaN and
        # falls through (deliberately — see MvRoom's own comment). A generated
        # WAV is the smallest thing Chromium will decode.
        short_wav = os.path.join(SCRATCH_DIR, "short-clip.wav")
        _write_silent_wav(short_wav, seconds=6)
        await page.set_input_files(AUDIO_INPUT, short_wav)
        # Do NOT delete the file before the assertion, the way the size step
        # above does. `set_input_files` hands the browser a PATH and the browser
        # reads it asynchronously; the size check only needs `File.size`
        # metadata, but the duration check has to decode the bytes. Removing it
        # first produces `ERR_FILE_NOT_FOUND` in the console, `duration` of NaN,
        # and NO toast — which reads exactly like the guard not existing.
        await page.wait_for_selector("text=Audio must be at least", state="visible")
        os.remove(short_wav)
        # No focus frame, exactly like 26/27 — the toast IS the whole subject.
        # That also makes this shot re-capturable on its own (nothing to merge
        # into focus.json), which is how it was first taken: this path needs no
        # credits, so it does not require the NEXT_PUBLIC_DEMO_CREDITS server
        # the rest of this function runs against.
        await shoot(cap, "44_import_reject_too_short.png")
        await page.wait_for_timeout(2700)

        # Trim floor: pick a song, drag the end handle to under 30s
        await open_choose_song(page)
        await pick_song(page, "my", 0)
        start_box = await cap.box(".mv-trim-sheet__handle--start")
        end_box = await cap.box(".mv-trim-sheet__handle--end")
        track_box = await cap.box(".mv-trim-sheet__waveform")
        target_x = start_box["x"] + track_box["width"] * 0.08  # ~8% of track width
        await page.mouse.move(end_box["x"] + end_box["width"] / 2, end_box["y"] + end_box["height"] / 2)
        await page.mouse.down()
        await page.mouse.move(target_x, end_box["y"] + end_box["height"] / 2, steps=8)
        await page.mouse.up()
        await page.wait_for_timeout(300)
        await shoot(cap, "28_trim_floor.png", [".mv-trim-sheet__desc"], "Selected", kind="info")
        await page.click(".mv-sheet__close")
        await page.wait_for_timeout(300)

        # Face picker crop
        with open(FACE_IMAGE, "rb") as f:
            face_bytes = f.read()
        await page.set_input_files(PHOTO_INPUT, [
            {"name": "face.jpg", "mimeType": "image/jpeg", "buffer": face_bytes}
        ])
        await page.wait_for_selector(".face-picker", state="visible")
        await page.wait_for_timeout(400)
        await shoot(cap, "29_face_picker_crop.png", [".face-picker__confirm"], "Use This Face")
        await page.click(".face-picker__confirm")
        await page.wait_for_timeout(400)

        # Settings: Pro-gated High crown
        await page.click(SETTINGS_BTN)
        await page.wait_for_selector(".mv-settings__group", state="visible")
        await page.wait_for_timeout(300)
        await shoot(cap, "30_settings_high_crown.png",
                    [".mv-settings__seg-opt:has-text('High')"], "High")
        await page.click(".mv-settings__seg-opt:has-text('High')")
        await page.wait_for_selector("text=Upgrade Your Plan", state="visible")
        await shoot(cap, "31_subscribe_from_settings.png")
        await page.click(".upgrade-dialog__close")
        await page.wait_for_timeout(300)

        # ══════════════════════════════════════════════════════════════════
        # P7 · Side rail — Trending vs My Creations
        # ══════════════════════════════════════════════════════════════════
        await go("/mv/room")
        await shoot(cap, "32_side_rail_trending.png", [".mv-create__side-see-all"], "See all")

        # generate one more MV in-session (client-side nav only, so History
        # state survives) so the rail can flip to My Creations without a
        # reload resetting it back to empty.
        await fill_description(page, DESCRIPTION)
        await open_choose_song(page)
        await pick_song(page, "my", 0)
        await confirm_trim(page)
        await open_mode_modal(page)
        await page.click(".mv-mode-card:not(.mv-mode-card--featured)")
        await wait_generation_done(page, "/mv/creating")
        await wait_generation_done(page, "/mv/result", timeout=20000)
        await freeze_video(page)

        # Recreate -> back to /mv/room via CLIENT navigation, History intact
        await page.click("text=Recreate")
        await page.wait_for_url("**/mv/room**")
        await page.wait_for_timeout(500)
        await shoot(cap, "33_side_rail_my_creations.png")

        # ══════════════════════════════════════════════════════════════════
        # P8 · Result screen — remaining controls tour
        # ══════════════════════════════════════════════════════════════════
        # fresh generation to tour, this session's balance already covers it
        await fill_description(page, DESCRIPTION)
        await open_choose_song(page)
        await pick_song(page, "my", 0)
        await confirm_trim(page)
        await open_mode_modal(page)
        await page.click(".mv-mode-card:not(.mv-mode-card--featured)")
        await wait_generation_done(page, "/mv/creating")
        await wait_generation_done(page, "/mv/result", timeout=20000)
        await freeze_video(page)

        await page.click("[aria-label='Like']")
        await page.wait_for_timeout(200)
        await shoot(cap, "34_result_like.png", ["[aria-label='Unlike']"], "Like", kind="info")

        await page.click("text=Share")
        await page.wait_for_selector("[role='dialog'][aria-label='Share']", state="visible")
        await page.wait_for_timeout(300)
        await shoot(cap, "35_result_share_dialog.png")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(300)

        await page.click("[aria-label='Publish to community']")
        await page.wait_for_selector(".publish-dialog", state="visible")
        await page.wait_for_timeout(300)
        await shoot(cap, "36_result_publish_confirm.png", [".publish-dialog__confirm"], "Confirm")
        await page.click(".publish-dialog__confirm")
        await page.wait_for_timeout(400)
        await shoot(cap, "37_result_publish_pending.png")

        await goto_history(page)
        # open the most recent done MV row from History (cold-start variant).
        # New rows are prepended, so .first() is the one just generated above.
        await page.get_by_role("link", name="My Wedding Ballad").first.click()
        await page.wait_for_url("**/mv/result**")
        await page.wait_for_timeout(600)
        await freeze_video(page)
        await shoot(cap, "38_result_from_history.png")

        print("console errors:", cap.errors or "none")


async def main_credits_gate(base):
    """P5 (guest gate) and P6 (insufficient credits) — against the PLAIN
    default-credit server (no NEXT_PUBLIC_DEMO_CREDITS override)."""
    # P5: guest (no muse_auth seed)
    async with GuestNextCapture(HERE, base) as cap:
        page = cap.page
        await page.goto(f"{base}/mv/room", wait_until="networkidle")
        await page.wait_for_timeout(700)
        await shoot(cap, "39_guest_room.png")

        # AC-MV-01b: Import Audio stays ungated — a guest can reach a
        # CTA-ready state through it alone, with no sign-in modal ever
        # appearing. Real File objects aren't needed for Playwright's
        # set_input_files; the app's own validation only checks the
        # extension/MIME, and a fake audio buffer simply fails the metadata
        # probe and falls back to the documented 180s/0:00 placeholder.
        await page.set_input_files(AUDIO_INPUT, [
            {"name": "guest-import.mp3", "mimeType": "audio/mpeg", "buffer": b"not real audio"}
        ])
        await page.wait_for_selector(".mv-trim-sheet__trimmer", state="visible")
        await confirm_trim(page)
        await shoot(cap, "40_guest_import_ungated.png")

        # Song Library gates identically (same `requireLogin` wrapper) —
        # shown here without its own screenshot, since the sign-in modal is
        # pixel-identical either way; Create Music Video is the more central
        # trigger and the one AC-MV-01b names as the flow's own CTA gate.
        await fill_description(page, DESCRIPTION)
        await page.click(CTA)
        await page.wait_for_selector(".login-modal--sign-in", state="visible")
        await page.wait_for_timeout(300)
        await shoot(cap, "41_guest_signin_gate.png")

        await page.click("text=Continue with Apple")
        await page.wait_for_selector(".login-modal--success", state="visible")
        await page.wait_for_timeout(300)
        await shoot(cap, "42_guest_signed_in.png")
        print("P5 console errors:", cap.errors or "none")

    # P6: signed in, default (10) credits — every generation is naturally
    # insufficient (see module docstring).
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        await page.goto(f"{base}/mv/room", wait_until="networkidle")
        await page.wait_for_timeout(700)
        await fill_description(page, DESCRIPTION)
        await open_choose_song(page)
        await pick_song(page, "my", 0)
        await confirm_trim(page)
        await open_mode_modal(page)
        await page.click(".mv-mode-card--featured")
        await page.wait_for_selector("text=Upgrade Your Plan", state="visible")
        await page.wait_for_timeout(300)
        await shoot(cap, "43_insufficient_credits.png")
        print("P6 console errors:", cap.errors or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3010")
    ap.add_argument("--credits-gate-only", action="store_true",
                     help="Run only P5/P6 (point --base at a server with NO "
                          "NEXT_PUBLIC_DEMO_CREDITS override).")
    args = ap.parse_args()
    if args.credits_gate_only:
        asyncio.run(main_credits_gate(args.base))
    else:
        asyncio.run(main_hi_credit(args.base))
