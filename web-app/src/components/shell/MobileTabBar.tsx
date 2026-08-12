"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 2, Slice 2a / CH5) ──────────────
 *
 * Classes from `src/styles/designer/MobileTabBar.css`, verbatim from DP. This
 * REPLACES the 5-item bottom bar that `Sidebar.tsx` used to draw below `sm:`
 * (640px). Two behaviour changes ride along, which is why this slice has its own
 * e2e (plan R12 / S13):
 *   · five items → three (Home/MV/Song/History/Profile → Explore / + / History)
 *   · the phone cutover moves 640px → 767px
 * Profile leaves the bar entirely; it is reached from MobileHeader's account
 * button, and from the Sidebar profile footer on desktop.
 *
 * DP renders Explore and History as dead `<button>`s with no handler — this is a
 * visual prototype. They are real links here.
 */

const mask = (name: string) => {
  const url = `url("/assets/icons/ui/${name}.svg")`;
  return { maskImage: url, WebkitMaskImage: url };
};

export function MobileTabBar() {
  const [createOpen, setCreateOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { loggedIn, requireLogin } = useAuth();
  const { locale } = useLocale();
  const t = useT();

  const homePath = localePath(locale, "/");
  const historyPath = localePath(locale, "/history");
  const onHome = pathname === homePath;
  const onHistory = pathname.startsWith(historyPath);

  /** History is personal data — same gate the sidebar applies. */
  function guardHistory(e: React.MouseEvent) {
    if (!loggedIn) {
      e.preventDefault();
      requireLogin(() => router.push(historyPath));
    }
  }

  /**
   * The create sheet's two destinations (`/mv/room`, `/song/create`).
   *
   * NOT gated (product decision 2026-08-12) — a guest may open either screen
   * and compose freely; the gate sits on the actions inside them ("Song
   * library" / "Create Music Video" / "Create Song"). This used to call
   * `requireLogin` here, which meant a guest tapping ＋ got a sign-in modal
   * instead of the create screen — the same walled-off feel the sidebar had.
   * `guardHistory` above is unchanged: History IS personal data.
   */
  function go(e: React.MouseEvent, href: string) {
    e.preventDefault();
    setCreateOpen(false);
    router.push(localePath(locale, href));
  }

  return (
    <>
      <nav className="mobile-tabbar" aria-label="Primary">
        <Link
          href={homePath}
          className={`mobile-tabbar__item${onHome ? " mobile-tabbar__item--active" : ""}`}
          aria-current={onHome ? "page" : undefined}
        >
          <span className="mobile-tabbar__icon" style={mask("ic_compass_OL")} aria-hidden="true" />
          <span className="mobile-tabbar__label">{t("nav.explore")}</span>
        </Link>

        <button
          type="button"
          className="mobile-tabbar__create"
          onClick={() => setCreateOpen(true)}
          aria-label={t("nav.create")}
          aria-expanded={createOpen}
        >
          <span className="mobile-tabbar__create-icon" style={mask("ic_add")} aria-hidden="true" />
        </button>

        <Link
          href={historyPath}
          onClick={guardHistory}
          className={`mobile-tabbar__item${onHistory ? " mobile-tabbar__item--active" : ""}`}
          aria-current={onHistory ? "page" : undefined}
        >
          <span className="mobile-tabbar__icon" style={mask("ic_history_OL")} aria-hidden="true" />
          <span className="mobile-tabbar__label">{t("nav.history")}</span>
        </Link>
      </nav>

      {/* DP portals this to document.body. Rendering it inline instead keeps it
          out of the SSR/portal hazard class entirely (R-2) — the sheet is
          position-fixed, so the DOM parent does not affect where it appears. */}
      {createOpen && (
        <div
          className="mobile-tabbar-sheet-overlay"
          role="presentation"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="mobile-tabbar-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="What would you like to create?"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-tabbar-sheet__handle" aria-hidden="true" />
            <p className="mobile-tabbar-sheet__title">What would you like to create?</p>

            <Link
              href={localePath(locale, "/mv/room")}
              onClick={(e) => go(e, "/mv/room")}
              className="mobile-tabbar-sheet__option"
            >
              <span className="mobile-tabbar-sheet__badge mobile-tabbar-sheet__badge--mv">
                <span
                  className="mobile-tabbar-sheet__badge-icon"
                  style={mask("ic_video_ai")}
                  aria-hidden="true"
                />
              </span>
              <span className="mobile-tabbar-sheet__option-info">
                <span className="mobile-tabbar-sheet__option-title">{t("nav.createMv")}</span>
                <span className="mobile-tabbar-sheet__option-subtitle">
                  Selfie + music → cinematic MV
                </span>
              </span>
              <span
                className="mobile-tabbar-sheet__chevron"
                style={mask("ic_chevron-right")}
                aria-hidden="true"
              />
            </Link>

            <Link
              href={localePath(locale, "/song/create")}
              onClick={(e) => go(e, "/song/create")}
              className="mobile-tabbar-sheet__option"
            >
              <span className="mobile-tabbar-sheet__badge mobile-tabbar-sheet__badge--song">
                <span
                  className="mobile-tabbar-sheet__badge-icon"
                  style={mask("ic_song_ai")}
                  aria-hidden="true"
                />
              </span>
              <span className="mobile-tabbar-sheet__option-info">
                <span className="mobile-tabbar-sheet__option-title">{t("nav.createSong")}</span>
                <span className="mobile-tabbar-sheet__option-subtitle">
                  Lyrics + style → original track
                </span>
              </span>
              <span
                className="mobile-tabbar-sheet__chevron"
                style={mask("ic_chevron-right")}
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
