"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubscribe } from "@/components/providers/SubscribeProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { SUBSCRIPTION_PLANS } from "@/lib/user";
import type { TKey } from "@/lib/i18n/dictionaries/en";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 2, Slice 2a) ────────────────────
 *
 * Classes come from `src/styles/designer/Sidebar.css`, copied verbatim from DP.
 * No Tailwind utilities in here (G3-d) — the /history spike measured why: DP's
 * stylesheets are unlayered and Tailwind's are not, so a utility on a migrated
 * element loses silently rather than loudly.
 *
 * DP's: the markup, classes, collapse behaviour, signed-in profile footer.
 * WA's:  `useT()` labels (R-8), `localePath()` links (R-9), the auth gate.
 *
 * NOTE: this component no longer renders the mobile bottom bar. WA used to draw
 * both the desktop rail and the phone tab bar from one NAV array; DP splits them
 * into Sidebar + MobileTabBar with DIFFERENT item sets, so they are separate
 * components now (plan CH5).
 */

type NavKey = "home" | "mv" | "song" | "story" | "history" | "blog";
type NavItem = { key: NavKey; href: string; labelKey: TKey; icon: string };

/**
 * DP ships six items; two are hidden for MVP (CH6). AI Storybook has no screen
 * behind it at all (`href="#"` upstream) and Blog is deferred to V2. Hiding via a
 * constant rather than deleting means V2 re-enables them without re-deriving the
 * markup, and a demo cannot click into a blank page in the meantime.
 */
const HIDDEN: ReadonlySet<NavKey> = new Set<NavKey>(["story", "blog"]);

const NAV: NavItem[] = [
  { key: "home", href: "/", labelKey: "nav.home", icon: "ic_compass_OL" },
  { key: "mv", href: "/mv/room", labelKey: "nav.createMv", icon: "ic_video_ai" },
  { key: "song", href: "/song/create", labelKey: "nav.createSong", icon: "ic_song_ai" },
  { key: "story", href: "#", labelKey: "nav.storybook", icon: "ic_story_ai" },
  { key: "history", href: "/history", labelKey: "nav.history", icon: "ic_history_OL" },
  { key: "blog", href: "/blog", labelKey: "nav.blog", icon: "ic_file_text" },
];

/** Routes (unprefixed) that require sign-in; clicking them logged out opens the gate. */
// Nav destinations a guest cannot reach at all. The two CREATE entries are
// deliberately NOT here (product decision 2026-08-12): a guest may open
// `/mv/room` and `/song/create` and compose freely — gating the nav click made
// the whole create flow feel walled off, and `/mv/room` is where the marketing
// Navbar's "Start for Free" lands. The gate sits on the actions that actually
// cost something or need the user's own data instead:
//   · /mv/room     → "Song library" (needs My Songs) and "Create Music Video"
//   · /song/create → "Create Song"
// See `MvRoom.tsx` / `SongCompose.tsx`, spec area 09 §3 and AC-AUTH-01.
const GATED = new Set(["/history", "/profile", "/settings"]);

/** Below Laptop the rail collapses to icon-only by default; the toggle overrides it. */
const COLLAPSE_QUERY = "(max-width: 1024px)";

const mask = (name: string) => {
  const url = `url("/assets/icons/ui/${name}.svg")`;
  return { maskImage: url, WebkitMaskImage: url };
};

/** `useLayoutEffect` warns during SSR; fall back to `useEffect` there. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { loggedIn, requireLogin, profile, subscribed, subscribedPlan } = useAuth();
  const { openSubscribe } = useSubscribe();
  const { locale } = useLocale();
  const t = useT();

  /**
   * ── THE R-2 PATTERN — and this component is what proves it ────────────────
   *
   * DP writes the initial value as
   *   useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
   * The `typeof window` guard stops it CRASHING under SSR, which is exactly why it
   * looks safe. It isn't: it guarantees a hydration MISMATCH instead. The server
   * renders `false`; the client's first render reads the real media query; at any
   * width ≤1024 those disagree and React has to patch the DOM after the fact.
   *
   * So the rule is: initial state is an SSR-safe constant, and the real value is
   * read only after mount. `useLayoutEffect` rather than `useEffect` because it
   * runs before paint — DP's CSS has NO media query for the collapsed state (it is
   * purely class-driven), so correcting after paint would flash a 240px rail down
   * to 72px on every laptop-width load.
   *
   * Precedent already here: AuthProvider reads its store via `useSyncExternalStore`
   * with an explicit `getServerSnapshot`. Same principle — give the server a
   * defined answer, let the client correct on mount.
   */
  const [collapsed, setCollapsed] = useState(false);
  const manuallyOverridden = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia(COLLAPSE_QUERY);
    if (!manuallyOverridden.current) setCollapsed(mq.matches);
    const onChange = (e: MediaQueryListEvent) => {
      if (!manuallyOverridden.current) setCollapsed(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggleCollapsed() {
    manuallyOverridden.current = true;
    setCollapsed((c) => !c);
  }

  const homePath = localePath(locale, "/");
  function isActive(href: string) {
    if (href === "#") return false;
    const target = localePath(locale, href);
    return href === "/" ? pathname === homePath : pathname.startsWith(target);
  }

  function onNavClick(e: React.MouseEvent, href: string) {
    if (!loggedIn && GATED.has(href)) {
      e.preventDefault();
      requireLogin(() => router.push(localePath(locale, href)));
    }
  }

  const planName = SUBSCRIPTION_PLANS.find((p) => p.id === subscribedPlan)?.name;

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar__top">
        <div className="sidebar__logo-row">
          {!collapsed && (
            <Link href={homePath} className="sidebar__logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/brand/Logo.svg" alt="MUSE" />
            </Link>
          )}
          <button
            type="button"
            className="icon-button icon-button--small icon-button--ghost"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={toggleCollapsed}
          >
            <span className="icon-button__icon" style={mask("ic_panel_left")} aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          {NAV.filter((item) => !HIDDEN.has(item.key)).map((item) => (
            <Link
              key={item.key}
              href={localePath(locale, item.href)}
              className={`sidebar__nav-item${isActive(item.href) ? " sidebar__nav-item--active" : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={(e) => onNavClick(e, item.href)}
            >
              <span className="sidebar__nav-icon" style={mask(item.icon)} aria-hidden="true" />
              <span className="sidebar__nav-label">
                <span className="sidebar__nav-label-text">{t(item.labelKey)}</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {loggedIn && (
        <div className="sidebar__bottom">
          <Link href={localePath(locale, "/profile")} className="sidebar__profile">
            <span className="sidebar__profile-avatar">
              <span
                className="sidebar__profile-avatar-icon"
                style={mask("ic_user")}
                aria-hidden="true"
              />
            </span>
            <span className="sidebar__profile-copy">
              <span className="sidebar__profile-name">{profile.name}</span>
              <span className="sidebar__profile-plan">
                {subscribed ? (planName ?? t("profile.musePro")) : t("nav.freePlan")}
              </span>
            </span>
            <span
              className="sidebar__profile-chevron"
              style={mask("ic_chevron-right")}
              aria-hidden="true"
            />
          </Link>
          {/* DP opens its own UpgradeDialog here. WA's subscribe flow already
              lives in SubscribeModal — opened directly via SubscribeProvider
              (2026-08-11 designer fix) instead of `<Link href="/profile">`,
              which was a no-op when already on /profile. */}
          {!subscribed && (
            <button
              type="button"
              className="button button--medium button--tertiary sidebar__upgrade-button"
              onClick={() => openSubscribe()}
            >
              {/* Designer fix, 2026-08-07: missing the `button__label` wrap —
                  `.button--medium .button__label` is what carries Label/S
                  (12px/15px); without it this text used the ambient/inherited
                  size instead, which read as visibly oversized. */}
              <span className="button__label">{t("nav.upgrade")}</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
