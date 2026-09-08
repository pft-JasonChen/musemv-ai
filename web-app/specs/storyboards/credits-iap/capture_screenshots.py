#!/usr/bin/env python3
"""Capture the Credits & IAP (S5) screenshots AND measure every focus box.

Screenshot source: **live app capture**, not a static prototype -- same
convention as every other spec in this programme. Every screenshot comes from
driving the real Next.js dev server (already running on :3000 per the task
brief) with Playwright, signed in via the same `localStorage['muse_auth']`
seed the e2e specs use.

VIEWPORT -- D8 stands: desktop 1403x697 only, this repo's established
viewport (song-creation/history/shell-auth/mv-edit/profile-account all use
it), so every focus box is a percentage of the same captured container.

THREE SEPARATE BROWSER CONTEXTS, NOT ONE -- and the reason is a genuine
source-reading finding, not a style preference:

  Session A (`main_subscriber`) walks P1 (Subscribe) with a REAL, plan-picked
  click through the dialog -- this is the only way to demonstrate "credits
  granted == the picked plan's own credits", so it cannot be faked with a
  shortcut. It also walks P3 (Buy Credits) and P5's subscriber half.

  Session B (`main_free`) is a FRESH context that never subscribes, for P4
  (every entry point shows Subscribe, no gate) and P5's free-user CTA.

  Session C (`main_demo`) is a THIRD fresh context for everything the
  `?demo=1` panel drives (P2, P6) -- and it exists because of a real
  discovery: **every `openSubscribe()` call site in the whole app
  (RoomNavbar x2, DetailNavbar, MobileHeader, Sidebar, the home Navbar,
  ProfileView's Muse Pro row, and MV `SettingsModal`'s High-quality crown) is
  conditioned on `!subscribed`.** Once an account is subscribed there is no
  button or link anywhere that reopens `SubscribeModal` -- CR-05's "already on
  Muse Pro" branch has no live trigger once you ARE a subscriber. The only
  way it renders for real is the one case the code actually supports: the
  dialog stays mounted-open while `subscribed` flips true underneath it, and
  it re-renders into the already-Pro branch without ever closing. Session C
  reaches that by opening the dialog while free, then using the demo panel's
  real ACCOUNT -> Subscribe action (a genuine `subscribe()` call through
  `authStore`, not a demo flag -- the same bypass `profile-account` (S7) used
  for its own P3-S2) to flip `subscribed` while the dialog stays open. This
  is why P2's capture happens in the demo session and not in Session A: the
  demo panel's ACCOUNT Subscribe button is `disabled={subscribed}`, so it can
  only be used ONCE per session and Session A needs a REAL plan pick instead.

  Session C also carries every `apiError`/`creditsEmpty` shot, because they
  all need the panel open at some point and P2's bypass already lives there.

`onPurchased` ONLY fires from `CreditsView`'s OWN locally-mounted
`BuyCreditsModal` (its `onPurchased={(n) => flash(...)}` prop) -- the shared
instance every `.credit-balance` pill opens via `SubscribeProvider.openBuyCredits()`
is called with NO callback anywhere in the app, so buying through a HEADER
pill shows no toast at all. That is why P3's "Buy Now -> balance + toast" is
captured via `/profile/credits`'s own "Buy More" button, not the header pill.

USAGE
    # dev server already running on :3000 per the task brief
    python3 capture_screenshots.py [--base http://localhost:3000]
    python3 build_spec.py
"""
import argparse
import asyncio
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/credits-iap
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, "skills", "yco-spec"))

_SHARED = os.path.expanduser("~/Library/Caches/ms-playwright")
if "PLAYWRIGHT_BROWSERS_PATH" not in os.environ and os.path.isdir(_SHARED):
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = _SHARED

from capture_lib import Capture, chromium_path  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402
from PIL import Image  # noqa: E402

DESKTOP = (1403, 697)

UPGRADE_OVERLAY = ".upgrade-dialog-overlay--visible"
CREDITS_OVERLAY = ".credits-dialog-overlay--visible"


class NextCapture(Capture):
    """`Capture` against an already-running Next dev server, signed in via the
    same `localStorage['muse_auth']` seed the e2e specs use -- identical to
    every other storyboard spec's own `NextCapture`."""

    def __init__(self, feature_dir, base_url, seed_auth=True, **kw):
        kw.setdefault("viewport", DESKTOP)
        super().__init__(feature_dir, "", **kw)
        self.base_url = base_url.rstrip("/")
        self.seed_auth = seed_auth

    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._pw = await async_playwright().start()
        # Resolve the browser binary that actually EXISTS (2026-09-03). Playwright
        # launches the build its own version pins; a sandboxed image ships whatever
        # build it ships, and the mismatch fails with "Executable doesn't exist" plus
        # an instruction to run `playwright install` — the wrong move, because the
        # browser IS there under another build number. `capture_lib.chromium_path()`
        # has resolved this since the helper was extracted, and its own docstring
        # notes that two scripts had not adopted it; this was one of the two, so
        # re-capturing this spec was impossible on exactly the machines that most
        # need to re-capture it. `channel` and `executable_path` are mutually
        # exclusive, hence the branch.
        _exe = chromium_path()
        _launch = {"args": ["--no-sandbox", "--disable-dev-shm-usage"]}
        if _exe:
            _launch["executable_path"] = _exe
        else:
            _launch["channel"] = "chromium"
        self._browser = await self._pw.chromium.launch(**_launch)
        ctx = await self._browser.new_context(
            viewport=self.viewport, device_scale_factor=1)
        if self.seed_auth:
            await ctx.add_init_script("window.localStorage.setItem('muse_auth', '1')")
        # Hide Next.js's dev-mode build-activity indicator (`<nextjs-portal>`),
        # which sits at the same `fixed bottom-left` corner as the demo panel
        # and intercepts clicks there -- see `js_click`'s own docstring.
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
        # THREE separate `Capture` instances write this run's focus.json
        # (main_subscriber() + main_free() + main_demo()); see mv-edit's and
        # profile-account's identical note for why the base class's wholesale
        # write would clobber the earlier sessions' entries.
        if self.focus_map and os.path.exists(self.focus_path):
            with open(self.focus_path, encoding="utf-8") as f:
                existing = json.load(f)
            existing.update(self.focus_map)
            self.focus_map = existing
        return await super().__aexit__(*a)

    async def full_shot(self, name):
        """Full-page PNG; returns the container box `focus()` needs, read back
        from the SAVED FILE's real pixel size -- matches every sibling spec's
        identical helper."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=True)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}

    async def viewport_shot(self, name):
        """Plain (non-full-page) viewport PNG. Reserved for any state with a
        `position: fixed` element -- a DpDialog overlay, a toast, or the demo
        panel/handle -- which a full-page shot's artificially tall viewport
        would reposition. See mv-edit's/profile-account's identical note."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=False)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}


async def js_click(page, selector):
    """Click via direct DOM `.click()`, bypassing Playwright's pointer-position
    actionability entirely. Needed for every demo-panel control -- see
    profile-account's/mv-edit's identical docstring for why a normal (or even
    `force=True`) click on that corner lands on Next's dev-mode overlay
    instead."""
    ok = await page.evaluate(
        "(sel) => { const el = document.querySelector(sel);"
        " if (el) { el.click(); return true; } return false; }",
        selector)
    if not ok:
        raise SystemExit(f"js_click: selector matched nothing: {selector}")


async def js_click_text(page, tag, text, root=None):
    """Same as `js_click`, but finds the element by exact trimmed text content
    under an optional root selector -- for the demo handle's bare `DEMO`
    button and the ACCOUNT `Subscribe` action, neither of which has a stable
    attribute selector."""
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
    hidden/ambiguous duplicate -- see every sibling spec's identical helper."""
    for sel in targets:
        loc = page.locator(sel)
        n = await loc.count()
        if n == 0:
            raise SystemExit(f"focus selector matched nothing: {sel}")
        vis = await loc.filter(visible=True).count()
        if n > 1 and vis != 1:
            raise SystemExit(
                f"focus selector {sel} matched {n} elements "
                f"({vis} visible) -- narrow it")


def make_shoot(cap, page, full_page=True):
    """`full_page=False` for any state with a `position: fixed` element -- a
    DpDialog overlay, a toast, or the demo panel/handle."""
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
                    f"screenshot -- the frame would miss the control")
    return shoot


async def multi_focus(cap, page, name, frames, full_page=True):
    """Same shot, MULTIPLE labeled frames -- see mv-edit's/profile-account's
    identical helper."""
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
                f"screenshot -- the frame would miss the control")


async def modal_settled(page, overlay_sel):
    """Wait until exactly the named overlay reads opacity 1 -- the
    `sheetSettled()` pattern AGENTS.md requires for any DP overlay (never
    measure one still animating in). Same helper as shell-auth/mv-edit."""
    await page.wait_for_selector(overlay_sel, state="visible")
    await page.wait_for_function(
        "(sel) => { const o = document.querySelector(sel);"
        " return o && getComputedStyle(o).opacity === '1'; }",
        arg=overlay_sel, timeout=3000)
    await page.wait_for_timeout(150)


async def modal_gone(page, overlay_sel):
    """Wait for a DpDialog-family overlay to finish its fade-OUT and unmount
    (`useDialogTransition`, 300ms) rather than just checking visibility,
    which stays true mid-fade."""
    await page.wait_for_function(
        "(sel) => !document.querySelector(sel)", arg=overlay_sel, timeout=3000)
    await page.wait_for_timeout(100)


async def open_demo_panel(page):
    await js_click_text(page, "button", "DEMO")
    await page.wait_for_selector('aside[aria-label="Demo state panel"]', state="visible")
    await page.wait_for_timeout(150)


async def toggle_flag(page, label, on):
    await js_click(page, f'[role="switch"][aria-label="{label}"]')
    await page.wait_for_timeout(100)


async def collapse_demo_panel(page):
    await js_click(page, 'button[aria-label="Collapse demo panel"]')
    await page.wait_for_timeout(150)


async def close_demo_panel(page):
    await js_click(page, 'button[aria-label="Close demo panel"]')
    await page.wait_for_timeout(150)


# ════════════════════════════════════════════════════════════════════════════
# Session A -- REAL subscribe through the UI, then Buy Credits + Credits detail
# (subscriber half)
# ════════════════════════════════════════════════════════════════════════════
async def main_subscriber(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        overlay_shoot = make_shoot(cap, page, full_page=False)

        async def go(path):
            await page.goto(f"{base}{path}", wait_until="networkidle")
            await page.wait_for_timeout(500)

        # ── P1 -- Subscribe (Muse Pro) ──────────────────────────────────────
        await go("/profile")
        await multi_focus(cap, page, "01_profile_before_subscribe.png", [
            (['.account-page__row:has-text("Muse Pro") .button--secondary'], "Upgrade (Muse Pro row)", "action"),
            (['.sidebar__upgrade-button'], "Upgrade (sidebar)", "action"),
            (['.upgrade-button'], "Upgrade (header crown)", "action"),
        ])

        await page.click('.account-page__row:has-text("Muse Pro")')
        await modal_settled(page, UPGRADE_OVERLAY)
        await multi_focus(cap, page, "02_subscribe_open_weekly.png", [
            (['.upgrade-dialog__tab:has-text("Weekly")'], "Weekly tab (default)", "info"),
            (['.upgrade-dialog__cards--plans .upgrade-dialog__card:not(.upgrade-dialog__card--featured) .upgrade-dialog__cta'],
             "Subscribe (Weekly Basic)", "action"),
            (['.upgrade-dialog__cards--plans .upgrade-dialog__card--featured .upgrade-dialog__cta'],
             "Subscribe (Weekly Pro)", "action"),
            (['.upgrade-dialog__footer a:has-text("Terms of Use")'], "Terms of Use", "info"),
        ], full_page=False)

        await page.click('.upgrade-dialog__tab:has-text("Monthly")')
        await page.wait_for_timeout(150)
        await multi_focus(cap, page, "03_subscribe_monthly.png", [
            (['.upgrade-dialog__tab:has-text("Monthly")'], "Monthly tab", "info"),
        ], full_page=False)

        await page.click('.upgrade-dialog__tab:has-text("Yearly")')
        await page.wait_for_timeout(150)
        await multi_focus(cap, page, "04_subscribe_yearly.png", [
            (['.upgrade-dialog__tab:has-text("Yearly")'], "Yearly tab", "info"),
            (['.upgrade-dialog__card--featured .upgrade-dialog__feature:has-text("First Access to New Features")'],
             "Yearly-only benefit", "info"),
        ], full_page=False)

        await page.click(
            '.upgrade-dialog__cards--plans .upgrade-dialog__card--featured .upgrade-dialog__cta')
        await page.wait_for_selector('.anim-toast:has-text("Welcome to Muse Pro!")', state="visible")
        await page.wait_for_timeout(200)
        await overlay_shoot("05_subscribe_click_toast.png")

        await page.wait_for_timeout(1900)  # ProfileView's flash() clears at 1800ms
        no_crown = await page.locator('.upgrade-button').count()
        if no_crown:
            raise SystemExit("subscribe did not take effect -- header crown Upgrade button still shown")
        await multi_focus(cap, page, "06_profile_after_subscribe_shell.png", [
            (['.sidebar__profile-plan'], "Sidebar plan", "info"),
            (['.account-page__row:has-text("Muse Pro")'], "Muse Pro row", "info"),
        ])

        # ── P5 (subscriber half) -- /profile/credits ────────────────────────
        await page.click('.account-page__stats button')
        await page.wait_for_url("**/profile/credits", timeout=5000)
        await page.wait_for_timeout(500)
        await multi_focus(cap, page, "13_credits_detail_subscriber_all.png", [
            (['.credits-page__balance'], "Balance card", "info"),
            (['.credits-page__balance button'], "Buy More", "action"),
            (['.credits-page__tabs'], "All / Spend / Earn", "info"),
        ])

        await page.click('.credits-page__tabs .tabs__tab:has-text("Spend")')
        await page.wait_for_timeout(200)
        await shoot("14_credits_detail_spend.png")

        await page.click('.credits-page__tabs .tabs__tab:has-text("Earn")')
        await page.wait_for_timeout(200)
        await shoot("15_credits_detail_earn.png")

        await page.click('.credits-page__tabs .tabs__tab:has-text("All")')
        await page.wait_for_timeout(200)

        # ── P3 -- Buy Credits as a subscriber ───────────────────────────────
        await page.click('.credits-page__balance button')  # "Buy More"
        await modal_settled(page, CREDITS_OVERLAY)
        await multi_focus(cap, page, "08_buycredits_packs_default.png", [
            (['.credits-dialog__pack-slot:has-text("2,000")'], "Default selection (2,000, BEST VALUE)", "info"),
            (['.credits-dialog__pack-slot:has-text("1,000")'], "POPULAR + discount badge", "info"),
            (['.credits-dialog__cta'], "Buy Now", "action"),
        ], full_page=False)

        await page.click('.credits-dialog__pack:has-text("300")')
        await page.wait_for_timeout(150)
        await multi_focus(cap, page, "09_buycredits_select_pack.png", [
            (['.credits-dialog__pack-slot:has-text("300")'], "Selected pack", "action"),
        ], full_page=False)

        await page.click('.credits-dialog__cta')
        await page.wait_for_selector('[role="status"]:has-text("Added 300 credits")', state="visible")
        await page.wait_for_timeout(200)
        await overlay_shoot("10_buycredits_buy_toast.png")

        print("Session A console errors:", cap.errors or "none")


# ════════════════════════════════════════════════════════════════════════════
# Session B -- FREE user, never subscribes
# ════════════════════════════════════════════════════════════════════════════
async def main_free(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        overlay_shoot = make_shoot(cap, page, full_page=False)

        await page.goto(f"{base}/profile", wait_until="networkidle")
        await page.wait_for_timeout(500)

        # ── P4 -- free user: every entry point shows Subscribe, no gate ─────
        await multi_focus(cap, page, "11_free_profile_entry_points.png", [
            (['.account-page__row:has-text("Muse Pro") .button--secondary'], "Muse Pro row -> Subscribe", "action"),
            (['.sidebar__upgrade-button'], "Sidebar -> Subscribe", "action"),
            (['.upgrade-button'], "Header crown -> Subscribe", "action"),
            (['.credit-balance'], "Credit pill -> Buy Credits (redirects, CR-06)", "action"),
        ])

        await page.click('.credit-balance')
        await modal_settled(page, UPGRADE_OVERLAY)
        dialog_label = await page.locator('[role="dialog"]').get_attribute("aria-label")
        if dialog_label != "Upgrade Your Plan":
            raise SystemExit(
                f"credit pill for a free user should redirect straight to "
                f"SubscribeModal (aria-label 'Upgrade Your Plan'), got {dialog_label!r}")
        await multi_focus(cap, page, "12_free_creditpill_opens_subscribe.png", [
            (['.upgrade-dialog__title'], 'Dialog title reads "Upgrade Your Plan"', "info"),
        ], full_page=False)
        await page.keyboard.press("Escape")
        await modal_gone(page, UPGRADE_OVERLAY)

        # ── P5 (free half) -- /profile/credits CTA reads "Get Muse Pro" ─────
        await page.click('.account-page__stats button')
        await page.wait_for_url("**/profile/credits", timeout=5000)
        await page.wait_for_timeout(500)
        cta_text = await page.locator('.credits-page__balance button').inner_text()
        if "Get Muse Pro" not in cta_text:
            raise SystemExit(f"free-user Credits Detail CTA should read Get Muse Pro, got {cta_text!r}")
        await multi_focus(cap, page, "16_credits_detail_free_getmusepro.png", [
            (['.credits-page__balance button'], "Get Muse Pro", "action"),
        ])

        print("Session B console errors:", cap.errors or "none")


# ════════════════════════════════════════════════════════════════════════════
# Session C -- `?demo=1` panel: P2 (already-Pro, via the ACCOUNT bypass) and
# P6 (apiError on both dialogs, creditsEmpty on the ledger)
# ════════════════════════════════════════════════════════════════════════════
async def main_demo(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        overlay_shoot = make_shoot(cap, page, full_page=False)

        await page.goto(f"{base}/profile?demo=1", wait_until="networkidle")
        await page.wait_for_timeout(500)

        # ── P6a/c -- apiError, still a FREE user ────────────────────────────
        await open_demo_panel(page)
        await toggle_flag(page, "Backend API error", True)
        await collapse_demo_panel(page)

        await page.click('.account-page__row:has-text("Muse Pro")')
        await modal_settled(page, UPGRADE_OVERLAY)
        await overlay_shoot("17_apierror_subscribemodal.png",
                    ['.history-page__empty-cta'], "Retry")
        await page.keyboard.press("Escape")
        await modal_gone(page, UPGRADE_OVERLAY)

        await page.click('.credit-balance')
        await modal_settled(page, UPGRADE_OVERLAY)
        dialog_label = await page.locator('[role="dialog"]').get_attribute("aria-label")
        if dialog_label != "Upgrade Your Plan":
            raise SystemExit(
                f"apiError + free user via the credit pill should still show "
                f"SubscribeModal's own error (aria-label 'Upgrade Your Plan'), "
                f"got {dialog_label!r}")
        await overlay_shoot("19_apierror_freeuser_redirect.png")
        await page.keyboard.press("Escape")
        await modal_gone(page, UPGRADE_OVERLAY)

        # ── P2 -- already-Pro, reached via the demo panel's REAL ACCOUNT
        # Subscribe action while SubscribeModal stays mounted open (see this
        # script's own docstring for why there is no other live way to reach
        # this branch) ───────────────────────────────────────────────────────
        await open_demo_panel(page)
        await toggle_flag(page, "Backend API error", False)
        await collapse_demo_panel(page)

        await page.click('.account-page__row:has-text("Muse Pro")')
        await modal_settled(page, UPGRADE_OVERLAY)
        await open_demo_panel(page)
        await js_click_text(page, "button", "Subscribe", root='aside[aria-label="Demo state panel"]')
        await page.wait_for_timeout(300)
        await close_demo_panel(page)  # clears demo enabled/flags only -- the
                                       # real `subscribed` write survives it
        await page.wait_for_selector('[role="dialog"][aria-label="Muse Pro"]', state="visible")
        await page.wait_for_timeout(200)
        await overlay_shoot("07_subscribe_reopen_already_pro.png",
                    ['[role="dialog"][aria-label="Muse Pro"] button:has-text("Done")'], "Done")
        await page.click('[role="dialog"][aria-label="Muse Pro"] button:has-text("Done")')
        await modal_gone(page, UPGRADE_OVERLAY)

        # ── P6b -- apiError on BuyCreditsModal's OWN error (now a subscriber
        # via the bypass above) ─────────────────────────────────────────────
        # ⚠️ The `goto` below RE-ARMS the demo panel (`?demo=1`), and re-arming
        # costs the subscription: `subscribed` lives in `AuthProvider`'s memory
        # and a page load clears it (area 07's own `CR-E1`). The first version of
        # this script navigated and then went straight for the credit pill,
        # which by then belonged to a FREE user — so `BuyCreditsModal` rendered
        # `SubscribeModal` (CR-06), `.credits-dialog-overlay` never appeared and
        # the capture died on a 30s selector timeout.
        #
        # So: navigate, then subscribe AGAIN through the panel's own account
        # action before touching the pill. `collapse` (not `close`) keeps the
        # panel armed for the `creditsEmpty` block that follows.
        await page.goto(f"{base}/profile?demo=1", wait_until="networkidle")
        await page.wait_for_timeout(400)
        await open_demo_panel(page)
        await js_click_text(page, "button", "Subscribe", root='aside[aria-label="Demo state panel"]')
        await page.wait_for_timeout(300)
        await toggle_flag(page, "Backend API error", True)
        await collapse_demo_panel(page)

        await page.click('.credit-balance')
        await modal_settled(page, CREDITS_OVERLAY)
        dialog_label = await page.locator('[role="dialog"]').get_attribute("aria-label")
        if dialog_label != "Buy Credits":
            raise SystemExit(
                f"apiError + subscriber via the credit pill should show "
                f"BuyCreditsModal's OWN error (aria-label 'Buy Credits'), "
                f"got {dialog_label!r}")
        await overlay_shoot("18_apierror_buycreditsmodal.png",
                    ['.history-page__empty-cta'], "Retry")
        await page.keyboard.press("Escape")
        await modal_gone(page, CREDITS_OVERLAY)

        # ── P6d -- creditsEmpty on /profile/credits, all three tabs ─────────
        await open_demo_panel(page)
        await toggle_flag(page, "Backend API error", False)
        await toggle_flag(page, "Credits Detail — no records", True)
        await collapse_demo_panel(page)

        await page.click('.account-page__stats button')
        await page.wait_for_url("**/profile/credits", timeout=5000)
        await page.wait_for_timeout(500)
        await shoot("20_creditsempty_all.png")

        await page.click('.credits-page__tabs .tabs__tab:has-text("Spend")')
        await page.wait_for_timeout(200)
        await shoot("21_creditsempty_spend.png")

        await page.click('.credits-page__tabs .tabs__tab:has-text("Earn")')
        await page.wait_for_timeout(200)
        still_empty = await page.locator('.credits-page__empty').count()
        if not still_empty:
            raise SystemExit("creditsEmpty did not hold under the Earn tab too (AC-CR-12)")
        print("Earn tab verified empty too (no separate screenshot needed)")

        print("Session C console errors:", cap.errors or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    args = ap.parse_args()
    asyncio.run(main_subscriber(args.base))
    asyncio.run(main_free(args.base))
    asyncio.run(main_demo(args.base))
