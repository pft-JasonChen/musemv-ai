#!/usr/bin/env python3
"""Capture the Profile / Account & Settings (S7) screenshots AND measure every
focus box.

Screenshot source: **live app capture**, not a static prototype — same
convention as song-creation/mv-creation/history/shell-auth/mv-edit's capture
scripts. Every screenshot comes from driving the real Next.js dev server
(`npm run dev -- -p 3216`, this worktree's own port) with Playwright, signed
in via the same `localStorage['muse_auth']` seed the e2e specs use.

VIEWPORT — D8 stands, unchanged: desktop 1403x697 only (this repo's
established viewport; every focus box is a percentage of the captured
container). PLAN.md's S7 scope note explains why no phone exception applies
here: neither `/profile` nor `/settings` mounts a distinct phone component
tree — `/profile`'s phone back is `RoomNavbar`'s own `mobileBackHref` (already
captured by S6 on History) and `/settings`'s old `md:hidden` workaround was
deleted when drop 2 closed A5.

TWO THINGS THE CODE CONTRADICTS ABOUT THE PLAN.md SCOPE TABLE — both found
while reading source before capture, both recorded as decisions in
build_spec.py's own docstring:

1. **Terms of Use / Privacy Policy live on `/settings`, not `/profile`.**
   PLAN.md's P3 row lists them beside Muse Pro/Language as if they were
   `/profile` rows; `SettingsView.tsx` renders them, `ProfileView.tsx` does
   not (confirmed against the source and the area spec's own §2 route map,
   which already puts them under `SettingsView`). Captured under P4 here.
2. **The demo panel's `subOnApp` flag gates `/settings`' Unsubscribe row,
   not the `/profile` Muse Pro row.** `SettingsView.tsx:122` reads
   `demo.flags.subOnApp` to choose which confirm dialog Unsubscribe opens;
   `ProfileView.tsx`'s Muse Pro row reads only `subscribed` (a real, non-demo
   boolean) and has no phone-subscription branch of its own. Captured under
   P4, not P3.

THE FEEDBACK-SUBMIT FAILURE (AC-PROF-14 / PROF-E6) HAS NO CAPTURABLE TRIGGER.
PLAN.md's S7 scope note says `?demo=1` covers this state, but
`FeedbackDialog.tsx` calls no `useDemoState()`/`useDemoFlag()` at all, and
`MockMuseApi.submitFeedback` (`src/lib/api/mock.ts`) only throws when the
attachment batch exceeds 5&nbsp;MB — a condition the UI's own pick-refusal
(PROF-E5) already prevents from ever reaching Send. There is no demo flag
comparable to `jobFail` for this dialog. Recorded as an `open_questions` row
in build_spec.py and reported to the product owner as a real gap between the
agreed Phase 0 scope and the shipped code; not captured, not faked.

USAGE
    npm run dev -- -p 3216            # in another terminal, this worktree's own port
    python3 capture_screenshots.py [--base http://localhost:3216]
    python3 build_spec.py
"""
import argparse
import asyncio
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/profile-account
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, "skills", "yco-spec"))

_SHARED = os.path.expanduser("~/Library/Caches/ms-playwright")
if "PLAYWRIGHT_BROWSERS_PATH" not in os.environ and os.path.isdir(_SHARED):
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = _SHARED

from capture_lib import Capture  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402
from PIL import Image  # noqa: E402

DESKTOP = (1403, 697)

SCRATCH = "/private/tmp/claude-503/-Users-jasonchen-Documents-Claude-Projects-ycmuse-web-web-app/cb07d22c-a7ef-4893-9dff-0799f568e8e3/scratchpad"
SMALL_FILE = os.path.join(SCRATCH, "note.txt")           # ~2 KB
HUGE_FILE = os.path.join(SCRATCH, "huge_photo.jpg")      # ~6 MB — over the 5 MB total


class NextCapture(Capture):
    """`Capture` against an already-running Next dev server, signed in via the
    same `localStorage['muse_auth']` seed the e2e specs use — identical to
    mv-creation/history/shell-auth/mv-edit's own class."""

    def __init__(self, feature_dir, base_url, seed_auth=True, **kw):
        kw.setdefault("viewport", DESKTOP)
        super().__init__(feature_dir, "", **kw)
        self.base_url = base_url.rstrip("/")
        self.seed_auth = seed_auth

    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await self._browser.new_context(
            viewport=self.viewport, device_scale_factor=1)
        if self.seed_auth:
            await ctx.add_init_script("window.localStorage.setItem('muse_auth', '1')")
        # Hide Next.js's dev-mode build-activity indicator (`<nextjs-portal>`),
        # which sits at the same `fixed bottom-left` corner as the demo panel
        # and both intercepts clicks there (see `js_click`'s docstring) and
        # visually clutters every screenshot with an "N" badge that exists
        # only in `next dev`, never in production.
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
        # MERGE with whatever is already on disk instead of clobbering it —
        # this script runs TWO separate `Capture` instances against the same
        # focus.json (main() + main_logged_out()); see mv-edit's identical
        # note for why the base class's wholesale write would clobber the
        # first session's entries.
        if self.focus_map and os.path.exists(self.focus_path):
            with open(self.focus_path, encoding="utf-8") as f:
                existing = json.load(f)
            existing.update(self.focus_map)
            self.focus_map = existing
        return await super().__aexit__(*a)

    async def full_shot(self, name):
        """Full-page PNG; returns the container box `focus()` needs, read back
        from the SAVED FILE's real pixel size — matches history/shell-auth/
        mv-edit's identical helper."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=True)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}

    async def viewport_shot(self, name):
        """Plain (non-full-page) viewport PNG. Reserved for the ONE case a
        full-page shot actively misleads: the demo panel's `position: fixed`
        handle/card is repositioned relative to the ARTIFICIALLY TALL
        viewport Chromium uses for `full_page=True` — same reasoning as
        mv-edit's `.floating-cta` note. Also used for Modal captures, which
        are themselves `position: fixed; inset: 0`."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=False)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}


async def js_click(page, selector):
    """Click via direct DOM `.click()`, bypassing Playwright's pointer-position
    actionability entirely. Needed for every demo-panel control: it sits at
    `fixed bottom-3 left-3`, the exact corner Next.js's dev-mode build
    indicator (`<nextjs-portal>`) also occupies, so a normal (or even
    `force=True`) mouse-position click on that corner lands on the dev
    overlay instead of the intended button. `force=True` alone does not fix
    this — Playwright still dispatches at the element's screen coordinates,
    which the overlay still intercepts; only a same-process DOM `.click()`
    sidesteps the overlay."""
    ok = await page.evaluate(
        "(sel) => { const el = document.querySelector(sel);"
        " if (el) { el.click(); return true; } return false; }",
        selector)
    if not ok:
        raise SystemExit(f"js_click: selector matched nothing: {selector}")


async def js_click_text(page, tag, text, root=None):
    """Same as `js_click`, but finds the element by exact trimmed text content
    under an optional root selector — for controls with no stable attribute
    selector (the demo handle's bare `DEMO` button, the ACCOUNT `Subscribe`
    action)."""
    ok = await page.evaluate(
        """([tag, text, root]) => {
            const scope = root ? document.querySelector(root) : document;
            if (!scope) return false;
            const els = [...scope.querySelectorAll(tag)];
            const el = els.find((e) => e.textContent.trim() === text);
            if (el) { el.click(); return true; }
            return false;
        }""",
        [tag, text, root])
    if not ok:
        raise SystemExit(f"js_click_text: no <{tag}> with text {text!r} under {root}")


async def check(page, targets):
    """Fail loudly on a focus selector matching nothing, or matching a
    hidden/ambiguous duplicate — see mv-edit/history/shell-auth's identical
    helper and its docstring for why this exists."""
    for sel in targets:
        loc = page.locator(sel)
        n = await loc.count()
        if n == 0:
            raise SystemExit(f"focus selector matched nothing: {sel}")
        vis = await loc.filter(visible=True).count()
        if n > 1 and vis != 1:
            raise SystemExit(
                f"focus selector {sel} matched {n} elements "
                f"({vis} visible) — narrow it")


def make_shoot(cap, page, full_page=True):
    """`full_page=False` for any state with a `position: fixed` element — a
    Modal, or the demo panel/handle. See `viewport_shot`'s own docstring."""
    async def shoot(name, targets=None, label=None, kind="action"):
        await page.wait_for_timeout(200)
        if targets:
            await check(page, targets)
        cb = await (cap.full_shot(name) if full_page else cap.viewport_shot(name))
        if targets:
            await cap.focus(name, cb, targets, label, kind=kind)
            got = cap.focus_map[name][-1]["box"]
            x, y, w, h = got
            if not (0 <= x < 100 and 0 <= y < 100 and 0 < w <= 100 and 0 < h <= 100
                    and x + w <= 101 and y + h <= 101):
                raise SystemExit(
                    f"{name}: focus box {got} is outside its own "
                    f"screenshot — the frame would miss the control")
    return shoot


async def multi_focus(cap, page, name, frames, full_page=True):
    """Same shot, MULTIPLE labeled frames — see mv-edit's identical helper."""
    await page.wait_for_timeout(200)
    for targets, _label, _kind in frames:
        await check(page, targets)
    cb = await (cap.full_shot(name) if full_page else cap.viewport_shot(name))
    for targets, label, kind in frames:
        await cap.focus(name, cb, targets, label, kind=kind)
        got = cap.focus_map[name][-1]["box"]
        x, y, w, h = got
        if not (0 <= x < 100 and 0 <= y < 100 and 0 < w <= 100 and 0 < h <= 100
                and x + w <= 101 and y + h <= 101):
            raise SystemExit(
                f"{name}: focus box {got} is outside its own "
                f"screenshot — the frame would miss the control")


async def main(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        overlay_shoot = make_shoot(cap, page, full_page=False)

        async def go(path):
            await page.goto(f"{base}{path}", wait_until="networkidle")
            await page.wait_for_timeout(600)

        # ══════════════════════════════════════════════════════════════════
        # P1 — Profile hub
        # ══════════════════════════════════════════════════════════════════
        await go("/profile")
        await multi_focus(cap, page, "01_profile_identity_stats.png", [
            (['button[aria-label="Edit Profile"]'], "Edit", "info"),
            (['.account-page__stats button'], "Credits", "action"),
            (['.account-page__stats a:nth-of-type(1)'], "MVs", "action"),
            (['.account-page__stats a:nth-of-type(2)'], "Songs", "action"),
        ])
        await multi_focus(cap, page, "02_profile_rows_overview.png", [
            (['.account-page__row:has-text("Muse Pro")'], "Muse Pro", "info"),
            (['.account-page__row:has-text("Language")'], "Language", "info"),
            (['.account-page__row:has-text("History")'], "History", "info"),
            (['.account-page__row:has-text("Send Feedback")'], "Send Feedback", "info"),
            (['.account-page__row:has-text("Settings")'], "Settings", "info"),
        ])

        # ══════════════════════════════════════════════════════════════════
        # P2 — Edit profile
        # ══════════════════════════════════════════════════════════════════
        await page.click('button[aria-label="Edit Profile"]')
        await page.wait_for_selector('[role="dialog"][aria-label="Edit Profile"]', state="visible")
        await page.wait_for_timeout(250)
        await overlay_shoot("03_edit_profile_open.png",
                    ['.account-edit__change-photo'], "Change Photo")

        await page.click(".account-edit__change-photo")
        await page.wait_for_timeout(150)
        name_input = page.locator('.account-edit__field input[maxlength="30"]')
        await name_input.fill("Jamie Rivera")
        await page.wait_for_timeout(150)
        await overlay_shoot("04_edit_profile_avatar_name_changed.png",
                    ['.account-edit__actions .button--secondary'], "Save")

        await page.click(".account-edit__actions .button--secondary")
        await page.wait_for_selector('[role="dialog"][aria-label="Edit Profile"]', state="detached")
        await page.wait_for_timeout(300)
        await shoot("05_edit_profile_saved_toast.png")

        # ══════════════════════════════════════════════════════════════════
        # P3 — Rows: Muse Pro (not subscribed) + Language
        # ══════════════════════════════════════════════════════════════════
        # The "Profile updated" toast auto-clears after 1.8s (ProfileView.tsx's
        # own `flash()`); wait it out so 06 isn't contaminated by 05's toast
        # still fading in the corner.
        await page.wait_for_timeout(1700)
        await shoot("06_muse_pro_not_subscribed.png",
                    ['.account-page__row:has-text("Muse Pro") .button--secondary'], "Upgrade")

        # Flip `subscribed` via the demo panel's ACCOUNT action (a real write
        # through `authStore`/`subscribe()`, not a demo flag) — bypasses
        # SubscribeModal entirely, which the S7 scope forbids photographing.
        await page.goto(f"{base}/profile?demo=1", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await js_click_text(page, "button", "DEMO")
        await page.wait_for_selector('aside[aria-label="Demo state panel"]', state="visible")
        await page.wait_for_timeout(200)
        await js_click_text(page, "button", "Subscribe", root='aside[aria-label="Demo state panel"]')
        await page.wait_for_timeout(300)
        # Dismiss the panel (clears demo flags, NOT the real `subscribed`
        # write above — they are separate stores) so 07 is a clean capture.
        await js_click(page, 'button[aria-label="Close demo panel"]')
        await page.wait_for_timeout(300)
        await shoot("07_muse_pro_subscribed.png",
                    ['.account-page__row:has-text("Muse Pro")'], "Muse Pro row", kind="info")

        await page.click('.account-page__row:has-text("Language")')
        await page.wait_for_selector('[role="dialog"][aria-label="Language"]', state="visible")
        await page.wait_for_timeout(250)
        await overlay_shoot("08_language_picker.png")

        # German — Latin-script, so nothing here risks the spec's own
        # CJK-in-step-text gate; picked purely to demonstrate AC-PROF-05.
        await page.locator('[role="dialog"][aria-label="Language"] button:has-text("Deutsch")').click()
        await page.wait_for_url("**/deu/profile**", timeout=5000)
        await page.wait_for_timeout(500)
        await shoot("09_language_switched.png",
                    ['.account-page__row:has-text("Language")'], "Language row", kind="info")

        # Back to English for every capture below.
        await page.click('.account-page__row:has-text("Language")')
        await page.wait_for_selector('[role="dialog"][aria-label="Language"]', state="visible")
        await page.wait_for_timeout(200)
        await page.locator('[role="dialog"][aria-label="Language"] button:has-text("English")').click()
        await page.wait_for_url("**/profile**", timeout=5000)
        await page.wait_for_timeout(400)

        # ══════════════════════════════════════════════════════════════════
        # P4 — /settings: Terms/Privacy, Unsubscribe (both variants),
        # Delete Account, Sign Out (row only — S6 P6 owns the flow)
        # ══════════════════════════════════════════════════════════════════
        await go("/settings")
        await multi_focus(cap, page, "10_settings_overview.png", [
            (['.account-page__row:has-text("Terms of Use")'], "Terms of Use", "action"),
            (['.account-page__row:has-text("Privacy Policy")'], "Privacy Policy", "action"),
            (['.account-page__row:has-text("Unsubscribe")'], "Unsubscribe", "info"),
            (['.account-page__row:has-text("Delete Account")'], "Delete Account", "info"),
            (['.account-page__row:has-text("Sign Out")'], "Sign Out", "info"),
        ])

        await page.click('.account-page__row:has-text("Unsubscribe")')
        await page.wait_for_selector('[role="dialog"][aria-label="Unsubscribe?"]', state="visible")
        await page.wait_for_timeout(250)
        await overlay_shoot("11_unsubscribe_confirm.png",
                    ['[role="dialog"][aria-label="Unsubscribe?"] button:has-text("Unsubscribe")'],
                    "Unsubscribe")
        await page.click('[role="dialog"][aria-label="Unsubscribe?"] button:has-text("Unsubscribe")')
        await page.wait_for_timeout(300)
        await shoot("12_unsubscribe_toast.png")

        # Delete Account confirm
        await page.click('.account-page__row:has-text("Delete Account")')
        await page.wait_for_selector('[role="dialog"][aria-label="Delete Account?"]', state="visible")
        await page.wait_for_timeout(250)
        await overlay_shoot("13_delete_account_confirm.png",
                    ['[role="dialog"][aria-label="Delete Account?"] button:has-text("Delete")'],
                    "Delete")
        await page.click('[role="dialog"][aria-label="Delete Account?"] button:has-text("Delete")')
        await page.wait_for_url(f"{base}/", timeout=5000)
        await page.wait_for_timeout(400)
        await shoot("14_delete_account_done_home.png")

        # ── Unsubscribe while "subscribed on a phone" (subOnApp demo flag) ──
        # Delete Account is a demo toast only (AC-PROF-07) — it never calls
        # `signOut()`, so `muse_auth` is still set; but this IS a fresh
        # `page.goto` (full navigation), which remounts every provider and
        # resets in-memory state (credits/subscribed default back). That is
        # fine here: SettingsView's Unsubscribe row branches only on the
        # DEMO `subOnApp` flag, never on the real `subscribed` boolean, so
        # which dialog opens does not depend on it.
        await page.goto(f"{base}/settings?demo=1", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await js_click_text(page, "button", "DEMO")
        await page.wait_for_selector('aside[aria-label="Demo state panel"]', state="visible")
        await page.wait_for_timeout(200)
        sub_on_app = 'aside[aria-label="Demo state panel"] [role="switch"][aria-label*="Subscribed on a phone"]'
        await js_click(page, sub_on_app)
        await page.wait_for_timeout(200)
        await js_click(page, 'button[aria-label="Collapse demo panel"]')
        await page.wait_for_timeout(200)
        await page.click('.account-page__row:has-text("Unsubscribe")')
        await page.wait_for_selector(
            '[role="dialog"][aria-label="Manage Subscription in the App Store"]', state="visible")
        await page.wait_for_timeout(250)
        # viewport_shot (not full_page): the demo panel's collapsed handle is
        # `position: fixed` and would be repositioned by a full-page capture.
        await overlay_shoot("15_unsubscribe_on_phone.png",
                    ['[role="dialog"][aria-label="Manage Subscription in the App Store"] button:has-text("Got It")'],
                    "Got It")
        await page.click('[role="dialog"][aria-label="Manage Subscription in the App Store"] button:has-text("Got It")')
        await page.wait_for_timeout(200)
        # Fully clear demo state before P5/P6 so those captures are clean.
        await js_click_text(page, "button", "DEMO")
        await page.wait_for_selector('aside[aria-label="Demo state panel"]', state="visible")
        await js_click(page, 'button[aria-label="Close demo panel"]')
        await page.wait_for_timeout(300)

        # ══════════════════════════════════════════════════════════════════
        # P5 — Send Feedback
        # ══════════════════════════════════════════════════════════════════
        await go("/profile")
        await page.click('.account-page__row:has-text("Send Feedback")')
        await page.wait_for_selector('[role="dialog"][aria-label="Send Feedback"]', state="visible")
        await page.wait_for_timeout(250)
        await overlay_shoot("16_feedback_form_empty.png",
                    ['[role="dialog"][aria-label="Send Feedback"] button[role="combobox"]'], "Type")

        await page.click('[role="dialog"][aria-label="Send Feedback"] button[role="combobox"]')
        await page.wait_for_selector('[role="dialog"][aria-label="Send Feedback"] [role="listbox"]',
                                      state="visible")
        await page.wait_for_timeout(200)
        await overlay_shoot("17_feedback_type_open.png",
                    ['[role="dialog"][aria-label="Send Feedback"] [role="option"]:has-text("Purchase and Payment")'],
                    "Purchase and Payment")
        await page.click('[role="dialog"][aria-label="Send Feedback"] [role="option"]:has-text("Purchase and Payment")')
        await page.wait_for_timeout(150)

        await page.fill(
            '[role="dialog"][aria-label="Send Feedback"] textarea',
            "The trim slider on /mv/room jumps back to 0:00 after I drag it past 45 seconds.",
        )
        await page.wait_for_timeout(150)
        await overlay_shoot("18_feedback_valid_send_enabled.png",
                    ['[role="dialog"][aria-label="Send Feedback"] button:has-text("Send")'], "Send")

        # Attachment: a small file first (chip appears)...
        await page.set_input_files(
            '[role="dialog"][aria-label="Send Feedback"] input[type="file"]', SMALL_FILE)
        await page.wait_for_timeout(200)
        await overlay_shoot("19_feedback_attachment_chip.png",
                    ['[role="dialog"][aria-label="Send Feedback"] ul li'], "Attached file", kind="info")

        # ...then a 6 MB file, which alone crosses the 5 MB CUMULATIVE budget —
        # refused WHOLE, the small file's chip untouched (PROF-E5).
        await page.set_input_files(
            '[role="dialog"][aria-label="Send Feedback"] input[type="file"]', HUGE_FILE)
        await page.wait_for_timeout(200)
        await overlay_shoot(
            "20_feedback_attachment_too_large.png",
            ['[role="dialog"][aria-label="Send Feedback"] p:has-text("too large")'],
            "Refusal message", kind="info")

        await page.click('[role="dialog"][aria-label="Send Feedback"] button:has-text("Send")')
        await page.wait_for_selector(
            '[role="dialog"][aria-label="Send Feedback"] button:has-text("Done")', state="visible",
            timeout=5000)
        await page.wait_for_timeout(200)
        await overlay_shoot("21_feedback_success_done.png",
                    ['[role="dialog"][aria-label="Send Feedback"] button:has-text("Done")'], "Done")
        await page.click('[role="dialog"][aria-label="Send Feedback"] button:has-text("Done")')
        await page.wait_for_selector('[role="dialog"][aria-label="Send Feedback"]', state="detached")

        print("Main-session console errors:", cap.errors or "none")


async def main_logged_out(base):
    """P6 — `/settings` visited directly while logged out (AC-PROF-17). A
    SEPARATE, un-seeded session so there is no leftover `muse_auth` from
    main()'s session — a fresh browser context, not a cleared one, is the
    only way to be sure nothing survives."""
    async with NextCapture(HERE, base, seed_auth=False) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)

        await page.goto(f"{base}/settings", wait_until="networkidle")
        await page.wait_for_selector('[role="dialog"][aria-label="Sign in to YouCam Muse"]',
                                      state="visible", timeout=5000)
        await page.wait_for_timeout(400)
        await shoot("22_settings_logged_out_gate.png")

        print("Logged-out session console errors:", cap.errors or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3216")
    args = ap.parse_args()
    asyncio.run(main(args.base))
    asyncio.run(main_logged_out(args.base))
