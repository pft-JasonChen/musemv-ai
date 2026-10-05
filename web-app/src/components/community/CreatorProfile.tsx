"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { Tabs } from "@/components/shell/RoomNavbar";
import { useSeedMvFlow } from "@/components/history/useOpenCreation";
import { DpIcon } from "@/components/ui/DpIcon";
import { IconButton } from "@/components/ui/IconButton";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { buildShareUrl } from "@/lib/share";
import { downloadFile } from "@/lib/download";
import { useMediaQuery, PHONE_QUERY } from "@/lib/ssr";
import { SAMPLE_AUDIO } from "@/lib/mv/mock";
import {
  CREATOR_MVS,
  CREATOR_SONGS,
  DEFAULT_CREATOR,
  formatCount,
  mvCoverRatio,
  type CommunityMv,
  type CommunitySong,
} from "@/lib/mv/community";
import { MOCK_USER } from "@/lib/user";
import { MvPreviewCard } from "@/components/community/MvPreviewCard";
import { useDemoFlag } from "@/components/demo/useDemo";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3e) ────────────────────
 *
 * DP source: `CommunityProfilePage` (Figma 1700:36586 / 1711:43159).
 * Classes come from `src/styles/designer/CommunityProfilePage.css`, verbatim.
 *
 * ── THE PER-ITEM MENU: SIX ACTIONS, ALL OF THEM REAL ────────────────────────
 *
 * The handoff flagged this screen as needing a product decision before it could
 * be built. DP's menu has Edit / Like / Share / Publish / Download / Delete, but
 * two of those are dead in DP itself — its Download and Delete handlers only
 * close the menu. Porting that verbatim would have shipped two buttons that do
 * nothing, which is the mirror image of the affordance-dropping regression G7
 * caught on the Muse Pro row.
 *
 * Decision (product owner, 2026-08-05): port all six and wire every one to real
 * behaviour, reusing the implementations `/history` already has —
 *   · Publish  → the toggle is always ON here (see below); switching it off
 *                unpublishes straight away, toasts, and the row leaves.
 *   · Download → `downloadFile`, the same helper History's menu calls.
 *   · Delete   → History's confirm modal, then the row leaves the list.
 * So the screen looks like DP and has no dead controls.
 *
 * ── PUBLIC PAGE = PUBLISHED WORKS ONLY (product owner, 2026-10-05) ──────────
 *
 * This is the creator's PUBLIC page, so everything on it is published — the
 * owner's self-view included. That retired three earlier decisions at once:
 * the Storyboard / Failed / Generating rows (2026-08-31 / 09-01, Figma
 * self-view) are gone, since none of them can be published; Publish has no
 * confirm/review here, since nothing on the page is unpublished to begin
 * with; and "Edit MV" never shows, because MV-13 hides it on a published MV.
 * Unpublishing removes the row from this page — it lives on in `/history`,
 * which is where drafts, failures and re-publishing belong.
 *
 * The three mutations are component state over static fixtures. That matches
 * every other community surface in this prototype — `CREATOR_MVS`/`CREATOR_SONGS`
 * are consts, there is no store behind them, and History does exactly the same
 * with its own `removed` set. A reload restores the seed data, deliberately.
 *
 * ── FOUR THINGS DP DOES THAT ARE NOT PORTED ─────────────────────────────────
 *
 * 1. `window.history.replaceState` on tab change. 3b's pre-flight measured what
 *    that costs: a URL write is a page jump even with `replace`. The active tab
 *    is component state, seeded from `?tab=` on first render only.
 * 2. `document.referrer` for the back target. Q6 rejected origin-in-the-URL
 *    schemes; `DetailNavbar` does `router.back()` with a section fallback.
 * 3. Bare anchors to DP's own paths for navigation. R-9: every link goes through
 *    the router with `localePath()`, or the locale prefix is silently lost.
 * 4. DP's own-profile sign-in gate as a route guard. `/creator` stays public —
 *    someone else's profile is public content, and adding a sixth guarded route
 *    would change the C7 route map (G4). Logged out, the owner menu simply is
 *    not rendered.
 *
 * A5 needs nothing here: since the 2026-08-06 drop `DetailNavbar` renders DP's
 * own compact mobile bar unless a caller passes `hideMobileBar`.
 */

type ProfileTab = "mv" | "songs";
const PROFILE_TABS = [
  { id: "mv" as const, label: "Music Videos" },
  { id: "songs" as const, label: "Songs" },
];

interface ProfileItem {
  id: string;
  title: string;
  cover: string;
  plays: number;
  likes: number;
  shares: number;
  date: string;
  kind: "mv" | "song";
  /** Where the row's cover/title goes — WA's own routes (D3), not DP's `?from=`. */
  href: string;
  /** What Download saves. MVs carry a real clip; songs share the demo track. */
  downloadUrl: string;
  downloadName: string;
  /** MVs only — the real clip the new preview card plays (2026-08-07). Empty
   *  for songs, which keep the small `.community-profile__item` row. */
  video: string;
}

function toggle(set: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

interface ProfileMenuProps {
  item: ProfileItem;
  isLiked: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  onLike: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onUnpublish: () => void;
  onCreateMv: () => void;
}

/**
 * The owner action menu on `/creator` — product owner, 2026-08-31: style,
 * open/close transition, and close-on-scroll all synced onto History's own
 * `.history-card__menu` (`HistoryView.tsx`'s `Menu`), which this is a close
 * copy of rather than a shared extraction — the row CONTENTS differ just
 * enough (always-ON Publish, no Edit MV) that pulling the
 * shell out from under a component with its own e2e coverage wasn't worth the
 * risk for a sync task. What's copied verbatim:
 *
 * · Portal + `getBoundingClientRect()`-computed `position: fixed` — proven to
 *   escape a grid card's stacking context, same reason History needs it.
 * · Always-mounted + `inert` + a `--visible` class driving `opacity` (0.2s) —
 *   not a conditional mount, so the SAME transition plays open AND close;
 *   `MenuProps`'s `open`/`setOpen` are owned by the caller (`CreatorProfile`'s
 *   `openMenu` state) for the same reason History's are.
 * · Close on SCROLL, not on outside click/Escape — replaces this screen's own
 *   previous `mousedown`/`keydown` listener, which (now that the menu is
 *   portalled to `document.body` instead of living inside
 *   `.community-profile__menu-shell`) would have misfired on every click
 *   inside the menu itself, since `.closest(".community-profile__menu-
 *   shell")` can never find an ancestor the portal detached it from.
 * · The invisible full-viewport backdrop that closes on click, and the phone
 *   bottom-sheet swap (`isPhone`) that skips the inline fixed-position style
 *   so `.history-card__menu`'s own `@media (max-width: 767px)` rule can turn
 *   it into a sheet instead.
 *
 * A standalone component, not inlined in the `.map()` above: each row needs
 * its OWN trigger ref and position state, and hooks cannot live inside a
 * plain per-iteration callback.
 */
function ProfileMenu(p: ProfileMenuProps) {
  const { item } = p;
  const isMv = item.kind === "mv";

  const btnRef = useRef<HTMLButtonElement>(null);
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  function toggleOpen() {
    if (!p.open) {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        const viewportWidth = document.documentElement.getBoundingClientRect().width;
        setPos({ top: rect.bottom + 4, right: Math.max(8, viewportWidth - rect.right) });
      }
    }
    p.setOpen(!p.open);
  }

  useEffect(() => {
    if (!p.open) return;
    function close() {
      p.setOpen(false);
    }
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.open]);

  return (
    <div className="history-card__menu-shell">
      <IconButton
        ref={btnRef}
        size="small"
        variant="tertiary"
        icon="ic_more"
        label="More"
        onClick={toggleOpen}
      />
      {createPortal(
        <>
          {p.open &&
            (isPhone ? (
              <div className="history-card__menu-backdrop" onClick={() => p.setOpen(false)} />
            ) : (
              <div className="fixed inset-0 z-[90]" onClick={() => p.setOpen(false)} />
            ))}
          <div
            className={`history-card__menu${p.open ? " history-card__menu--visible" : ""}`}
            role="menu"
            inert={!p.open}
            style={isPhone ? undefined : { position: "fixed", top: pos.top, right: pos.right }}
          >
            {isPhone && <div className="history-card__menu-handle" aria-hidden="true" />}
            {/* A song has no "Edit" here — same as History's own menu, a song
                row offers "Create MV" instead (gradient purple), spinning the
                song off into a NEW music video rather than editing it. */}
            {!isMv && (
              <button
                type="button"
                role="menuitem"
                className="history-card__menu-primary history-card__menu-primary--gradient"
                onClick={() => {
                  p.setOpen(false);
                  p.onCreateMv();
                }}
              >
                <DpIcon name="ic_video_ai" />
                Create MV
              </button>
            )}
            <button type="button" role="menuitem" onClick={p.onLike}>
              <DpIcon
                name={p.isLiked ? "ic_favorite_on" : "ic_favorite_off"}
                className={p.isLiked ? "history-card__menu-item-icon--active" : undefined}
              />
              {p.isLiked ? "Unlike" : "Like"}
            </button>
            <button type="button" role="menuitem" onClick={p.onShare}>
              <DpIcon name="ic_share" />
              Share
            </button>
            {/* Always ON: this page only lists published works (header note),
                so the only move left is OFF, which takes the row off the page. */}
            <div className="history-card__menu-publish">
              <span>
                <DpIcon as="i" name="ic_publish" />
                Publish
              </span>
              <ToggleSwitch
                checked
                onChange={(next) => {
                  if (!next) p.onUnpublish();
                }}
                ariaLabel={`Publish ${item.title}`}
              />
            </div>
            <button type="button" role="menuitem" onClick={p.onDownload}>
              <DpIcon name="ic_download" />
              Download
            </button>
            <button
              type="button"
              role="menuitem"
              className="history-card__menu-delete"
              onClick={p.onDelete}
            >
              <DpIcon name="ic_delete" />
              Delete
            </button>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

export function CreatorProfile() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale } = useLocale();
  const { loggedIn } = useAuth();
  const seedMvFlow = useSeedMvFlow();

  const self = params.get("self") === "1";
  // Seeded from the URL, then owned by the component — see note 1 above.
  const [tab, setTab] = useState<ProfileTab>(params.get("tab") === "songs" ? "songs" : "mv");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [liked, setLiked] = useState<ReadonlySet<string>>(() => new Set());
  // Rows the owner unpublished this session — they leave the public page
  // (header note) the same way a deleted row does, but stay in `/history`.
  const [unpublished, setUnpublished] = useState<ReadonlySet<string>>(() => new Set());
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  const [share, setShare] = useState<ProfileItem | null>(null);
  const [del, setDel] = useState<ProfileItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const creator = DEFAULT_CREATOR;
  const name = self ? MOCK_USER.name : creator.name;
  // Only your own items are yours to edit, publish or delete — DP gates the menu
  // the same way (`isOwnProfile`). Logged out, there is no "own" to speak of.
  const ownerMenu = self && loggedIn;
  // `profileEmpty` (`?demo=1` panel) — `CREATOR_MVS`/`CREATOR_SONGS` are
  // constants and can never be empty for real, so the flag is the only way
  // to reach this state. Last render-time branch, per `demoStore.ts`.
  const demoEmpty = useDemoFlag("profileEmpty");

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }

  const items = useMemo<ProfileItem[]>(() => {
    const rows: ProfileItem[] =
      tab === "mv"
        ? CREATOR_MVS.map((m: CommunityMv) => ({
            id: m.id,
            title: m.title,
            cover: m.thumb,
            plays: m.plays,
            likes: m.likes,
            shares: m.shares,
            date: m.date,
            kind: "mv",
            href: `/watch?id=${m.id}`,
            downloadUrl: m.video,
            downloadName: `${m.title}.mp4`,
            video: m.video,
          }))
        : CREATOR_SONGS.map((s: CommunitySong) => ({
            id: s.id,
            title: s.title,
            cover: s.cover,
            plays: s.plays,
            likes: s.likes,
            shares: s.shares,
            date: s.date,
            kind: "song",
            href: `/song/play?id=${s.id}`,
            downloadUrl: SAMPLE_AUDIO,
            downloadName: `${s.title}.mp3`,
            video: "",
          }));
    return demoEmpty ? [] : rows.filter((r) => !removed.has(r.id) && !unpublished.has(r.id));
  }, [tab, removed, unpublished, demoEmpty]);

  function open(item: ProfileItem) {
    router.push(localePath(locale, item.href));
  }

  function doUnpublish(item: ProfileItem) {
    setOpenMenu(null);
    setUnpublished((s) => new Set(s).add(item.id));
    showToast("Unpublished success");
  }

  function doDownload(item: ProfileItem) {
    setOpenMenu(null);
    downloadFile(item.downloadUrl, item.downloadName);
    showToast("Download started");
  }

  function confirmDelete() {
    if (!del) return;
    setRemoved((s) => new Set(s).add(del.id));
    setDel(null);
    showToast("Deleted");
  }

  // Same two-step History's own `createMv` uses: seed the (in-memory,
  // reload-losable) MV flow with this song's data, then land on `/mv/room`
  // to start a brand NEW MV seeded with its title/cover.
  function createMv(item: ProfileItem) {
    seedMvFlow({ id: item.id, title: item.title, thumb: item.cover });
    router.push(localePath(locale, "/mv/room"));
  }

  return (
    <>
      {/* No `mobileTitle` here (product owner, 2026-09-01): the compact phone
          bar's title would just repeat the `<h1>{name}</h1>` sitting right
          below the avatar a few pixels down — DP's own reason for passing it
          (a page with no other heading on phone) doesn't apply on this
          screen. `title` isn't right either — that switches the DESKTOP
          layout to icon-only-plus-centred-heading, a different screen. */}
      <DetailNavbar fallbackPath={self ? "/profile" : "/explore/mvs"} />

      <section className="community-profile">
        <aside className="community-profile__summary">
          <div className="community-profile__identity">
            {/* WA's data decides which of DP's two avatar treatments applies:
                the community creator has a photo, the mock signed-in user does
                not, so `self` gets DP's gradient fallback. */}
            {self ? (
              <span className="community-profile__avatar-fallback">
                <DpIcon name="ic_account" />
              </span>
            ) : (
              <img src={creator.avatar} alt="" />
            )}
            {/* Product owner request, 2026-08-14 — DP's `<p>` under the name used
                to render the creator's email. This page is intentionally public
                (see the route doc comment above), so an email address is private
                info that has no business being shown to every visitor; removed
                rather than gated behind `self`. */}
            <div>
              <h1>{name}</h1>
            </div>
          </div>
          <div className="community-profile__stats">
            <div>
              <strong>{creator.plays}</strong>
              <span>Plays</span>
            </div>
            <i />
            <div>
              <strong>{creator.likes}</strong>
              <span>Likes</span>
            </div>
          </div>
        </aside>

        <div className="community-profile__main">
          <Tabs tabs={PROFILE_TABS} active={tab} onChange={setTab} />

          <div className="community-profile__list">
            {items.length === 0 ? (
              // Product owner, 2026-08-28, Figma "Community User Profile —
              // Empty" (node 1961:42438): icon + "No works released yet",
              // no subtitle, no CTA — that's what's on screen for a visitor
              // looking at someone ELSE's page (`!self`), where prompting
              // them to go create is nonsensical. For `self` (own page, via
              // /creator?self=1 — /profile's MV/Song stat links land here),
              // the subtitle and a tab-specific CTA are added on top: the
              // handoff calls for one explicitly, and both strings already
              // exist as hidden layers on this same Figma node.
              <div className="community-profile__empty">
                <DpIcon name="ic_media" className="history-page__empty-icon" />
                <div className="history-page__empty-message">
                  <p className="history-page__empty-title">No works released yet</p>
                  {self && (
                    <p className="history-page__empty-subtitle">
                      Start making AI music or music videos and they&apos;ll all show up in one
                      place.
                    </p>
                  )}
                </div>
                {self && (
                  <button
                    type="button"
                    className="history-page__empty-cta"
                    onClick={() =>
                      router.push(localePath(locale, tab === "mv" ? "/mv/room" : "/song/create"))
                    }
                  >
                    {tab === "mv" ? "Create Music Video" : "Create Song"}
                  </button>
                )}
              </div>
            ) : (
              items.map((item) => {
                const isLiked = liked.has(item.id);
                const menuOpen = openMenu === item.id;

                const menu = ownerMenu && (
                  <ProfileMenu
                    item={item}
                    isLiked={isLiked}
                    open={menuOpen}
                    setOpen={(v) => setOpenMenu(v ? item.id : null)}
                    onLike={() => setLiked((s) => toggle(s, item.id))}
                    onShare={() => {
                      setOpenMenu(null);
                      setShare(item);
                    }}
                    onDownload={() => doDownload(item)}
                    onDelete={() => {
                      setOpenMenu(null);
                      setDel(item);
                    }}
                    onUnpublish={() => doUnpublish(item)}
                    onCreateMv={() => createMv(item)}
                  />
                );

                const actions = (
                  <>
                    <IconButton
                      size="small"
                      variant="ghost"
                      icon={isLiked ? "ic_favorite_on" : "ic_favorite_off"}
                      label={isLiked ? "Unlike" : "Like"}
                      onClick={() => setLiked((s) => toggle(s, item.id))}
                    />
                    <IconButton
                      size="small"
                      variant="ghost"
                      icon="ic_share"
                      label="Share"
                      onClick={() => setShare(item)}
                    />
                    {menu}
                  </>
                );

                if (item.kind === "mv") {
                  return (
                    <MvPreviewCard
                      key={item.id}
                      title={item.title}
                      video={item.video}
                      cover={item.cover}
                      ratio={mvCoverRatio(item.id)}
                      plays={item.plays}
                      likes={item.likes + (isLiked ? 1 : 0)}
                      shares={item.shares}
                      onOpen={() => open(item)}
                      actions={actions}
                    />
                  );
                }

                return (
                  <article className="community-profile__item" key={item.id}>
                    {/* An anchor with a real destination, click-intercepted so it
                      routes in-app — the same arrangement /history's card uses,
                      and what keeps middle-click and "copy link address" honest. */}
                    <a
                      className="community-profile__item-main"
                      href={localePath(locale, item.href)}
                      onClick={(e) => {
                        e.preventDefault();
                        open(item);
                      }}
                    >
                      <span className="community-profile__cover">
                        <img src={item.cover} alt="" />
                        <DpIcon name="ic_song" />
                      </span>
                      <span className="community-profile__copy">
                        <strong>{item.title}</strong>
                        {/* `<i>`, not `<span>`: the stylesheet sizes these with
                          `.community-profile__social i`. See DpIcon's `as`. */}
                        <span className="community-profile__social">
                          <span>
                            <DpIcon as="i" name="ic_headphones" />
                            {formatCount(item.plays)}
                          </span>
                          <span>
                            <DpIcon as="i" name="ic_favorite_off" />
                            {formatCount(item.likes + (isLiked ? 1 : 0))}
                          </span>
                          <span>
                            <DpIcon as="i" name="ic_share" />
                            {formatCount(item.shares)}
                          </span>
                        </span>
                        <time>{item.date}</time>
                      </span>
                    </a>

                    {/* Order is load-bearing: the phone rule hides
                      `.community-profile__actions > .icon-button:nth-child(2)`,
                      i.e. Share. Reordering these silently hides the wrong one. */}
                    <div className="community-profile__actions">{actions}</div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      <ShareDialog
        open={share !== null}
        onClose={() => setShare(null)}
        title={share?.title ?? ""}
        url={share ? buildShareUrl(share.id) : ""}
      />

      <Modal open={del != null} onClose={() => setDel(null)} title="Delete" maxWidth={380}>
        <p className="mb-4 text-[14px]" style={{ color: "var(--text-2)" }}>
          Are you sure you want to delete this item? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setDel(null)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-lg"
          style={{ background: "rgba(20,20,24,.95)" }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
