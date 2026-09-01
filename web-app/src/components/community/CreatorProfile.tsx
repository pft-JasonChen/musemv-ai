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
import { DpBadge } from "@/components/ui/DpBadge";
import { IconButton } from "@/components/ui/IconButton";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PublishConfirmDialog } from "@/components/ui/PublishConfirmDialog";
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
import { useDemoFlag, useDemoState } from "@/components/demo/useDemo";
import {
  publishRejectLabel,
  PUBLISH_REVIEW_DELAY_MS,
  type PublishRejectCode,
} from "@/lib/publishReview";

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
 *   · Publish  → MV confirms first, Song toggles straight away, both toast.
 *                Same MV-vs-Song split as History/MV Result/Song Create.
 *   · Download → `downloadFile`, the same helper History's menu calls.
 *   · Delete   → History's confirm modal, then the row leaves the list.
 *   · Edit     → `/mv/edit` for an MV, `/song/create` for a song.
 * So the screen looks like DP and has no dead controls.
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

/**
 * Storyboard / Failed / Generating outcomes — product owner, 2026-08-31
 * (Storyboard/Failed) and 2026-09-01 (Generating), Figma "Community User
 * Profile — MV Self-view" (1961:41878) and "— Song" (1711:43159).
 * `CommunityMv`/`CommunitySong` (`schemas.ts`) model only FINISHED community
 * content — every other reader (home sections, explore, the player pages)
 * has no failed/in-progress concept at all, so adding it there would widen a
 * shared contract for one screen. Kept local instead, keyed by id onto five
 * of the existing seed rows — the same shape `HistoryView` gets for free
 * from its own local `HistorySample` type. Ids, not new fixtures: the task
 * was to place these use cases at specific positions in the CURRENT list,
 * not to invent new titles matching Figma's own placeholder names
 * ("Starlight in Your Eyes", "Midnight Drive"). Generating's position (5th
 * MV row, 6th Song row) is this session's own call, continuing the sequence
 * Storyboard/Failed already started — the task didn't name one.
 */
const STORYBOARD_MV_ID = "cp-starfall-serenade"; // 3rd MV item
const FAILED_MV_ID = "cp-electric-dreams"; // 4th MV item
const GENERATING_MV_ID = "cp-urban-whispers"; // 5th MV item
const FAILED_SONG_ID = "cps-velvet-sky"; // 5th Song item
const GENERATING_SONG_ID = "cps-neon-pulse"; // 6th Song item

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
  /** `"failed"` — HIST-06's rule applies here too: Delete-only, no Like /
   *  Share / Publish / Download, and the cover/title stop opening anything.
   *  `"generating"` is the same restriction while the job is still running —
   *  nothing to Like/Share/Publish/Download yet either, and nothing to open. */
  status: "done" | "failed" | "generating";
  /** MVs only — no clip yet, so the row shows "Create MV" instead of Like/
   *  Share and routes to `/mv/storyboard`, not `/watch`. */
  isStoryboard: boolean;
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
  isPublished: boolean;
  isReviewing: boolean;
  rejectReason: PublishRejectCode | undefined;
  open: boolean;
  setOpen: (v: boolean) => void;
  onLike: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onPublish: (next: boolean) => void;
  onEdit: () => void;
  onCreateMv: () => void;
}

/**
 * The owner action menu on `/creator` — product owner, 2026-08-31: style,
 * open/close transition, and close-on-scroll all synced onto History's own
 * `.history-card__menu` (`HistoryView.tsx`'s `Menu`), which this is a close
 * copy of rather than a shared extraction — the row CONTENTS differ just
 * enough (this screen's own `restricted`/Create-MV handling) that pulling the
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
  const { locale } = useLocale();
  // "generating" gets the same restriction as "failed" — nothing to Like /
  // Share / Publish / Download while the job is still running either.
  const restricted = item.status !== "done" || item.isStoryboard;
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
            {/* MV-13, same as HistoryView's menu: while an MV is published or
                pending, this entry disappears rather than becoming "Unpublish
                to edit" — the Publish toggle below is the only way back to
                editable. Songs never review (rule 3), so this never hides. */}
            {!restricted && isMv && !p.isPublished && !p.isReviewing && (
              <a
                role="menuitem"
                className="history-card__menu-primary"
                href={localePath(locale, "/mv/edit")}
                onClick={(e) => {
                  e.preventDefault();
                  p.onEdit();
                }}
              >
                <DpIcon name="ic_edit" />
                Edit MV
              </a>
            )}
            {/* A song has no "Edit" here — same as History's own menu, a song
                row offers "Create MV" instead (gradient purple), spinning the
                song off into a NEW music video rather than editing it. */}
            {!restricted && !isMv && (
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
            {!restricted && (
              <button type="button" role="menuitem" onClick={p.onLike}>
                <DpIcon
                  name={p.isLiked ? "ic_favorite_on" : "ic_favorite_off"}
                  className={p.isLiked ? "history-card__menu-item-icon--active" : undefined}
                />
                {p.isLiked ? "Unlike" : "Like"}
              </button>
            )}
            {!restricted && (
              <button type="button" role="menuitem" onClick={p.onShare}>
                <DpIcon name="ic_share" />
                Share
              </button>
            )}
            {!restricted && (
              <div className="history-card__menu-publish">
                <span>
                  <DpIcon as="i" name="ic_publish" />
                  {p.rejectReason ? (
                    // Same "History Menu / self-view profile Menu" Figma as
                    // HistoryView's own reject row (node 2695:117710) —
                    // identical treatment, shared class names.
                    <span className="history-card__menu-publish-text">
                      <span className="history-card__menu-publish-title">
                        Publish <em>(Rejected)</em>
                      </span>
                      <span className="history-card__menu-publish-reason">
                        {publishRejectLabel(p.rejectReason)}
                      </span>
                    </span>
                  ) : (
                    "Publish"
                  )}
                </span>
                <ToggleSwitch
                  checked={p.isPublished}
                  onChange={(next) => p.onPublish(next)}
                  ariaLabel={`Publish ${item.title}`}
                />
              </div>
            )}
            {!restricted && (
              <button type="button" role="menuitem" onClick={p.onDownload}>
                <DpIcon name="ic_download" />
                Download
              </button>
            )}
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
  // `published` is the live/approved state only; `reviewing` is the pending
  // phase in between (product owner, 2026-08-28) — same split as
  // `HistoryView`'s `published`/`reviewing` override fields, mirrored here so
  // the two menus behave identically.
  const [published, setPublished] = useState<ReadonlySet<string>>(() => new Set());
  const [reviewing, setReviewing] = useState<ReadonlySet<string>>(() => new Set());
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  const [share, setShare] = useState<ProfileItem | null>(null);
  const [pubConfirm, setPubConfirm] = useState<ProfileItem | null>(null);
  const [del, setDel] = useState<ProfileItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // 2.5: same shape as `HistoryView`'s override map — a reject reverts the item
  // to unpublished (rule 2), so the reason lives beside it rather than as a
  // fourth persistent status, and clears the moment a resubmit is accepted.
  const [rejectReasons, setRejectReasons] = useState<Record<string, PublishRejectCode>>({});

  const creator = DEFAULT_CREATOR;
  const name = self ? MOCK_USER.name : creator.name;
  // Only your own items are yours to edit, publish or delete — DP gates the menu
  // the same way (`isOwnProfile`). Logged out, there is no "own" to speak of.
  const ownerMenu = self && loggedIn;
  // `profileEmpty` (`?demo=1` panel) — `CREATOR_MVS`/`CREATOR_SONGS` are
  // constants and can never be empty for real, so the flag is the only way
  // to reach this state. Last render-time branch, per `demoStore.ts`.
  const demoEmpty = useDemoFlag("profileEmpty");
  const demo = useDemoState();

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }

  const items = useMemo<ProfileItem[]>(() => {
    const rows: ProfileItem[] =
      tab === "mv"
        ? CREATOR_MVS.map((m: CommunityMv) => {
            const isStoryboard = m.id === STORYBOARD_MV_ID;
            return {
              id: m.id,
              title: m.title,
              cover: m.thumb,
              plays: m.plays,
              likes: m.likes,
              shares: m.shares,
              date: m.date,
              kind: "mv",
              // A storyboard has no clip to watch yet — same destination
              // HistoryView's own `rowHref` sends a storyboard row to.
              href: isStoryboard ? `/mv/storyboard?id=${m.id}` : `/watch?id=${m.id}`,
              downloadUrl: m.video,
              downloadName: `${m.title}.mp4`,
              video: m.video,
              status:
                m.id === FAILED_MV_ID
                  ? "failed"
                  : m.id === GENERATING_MV_ID
                    ? "generating"
                    : "done",
              isStoryboard,
            };
          })
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
            status:
              s.id === FAILED_SONG_ID
                ? "failed"
                : s.id === GENERATING_SONG_ID
                  ? "generating"
                  : "done",
            isStoryboard: false,
          }));
    return demoEmpty ? [] : rows.filter((r) => !removed.has(r.id));
  }, [tab, removed, demoEmpty]);

  function open(item: ProfileItem) {
    // Same guard as HistoryView's `openRow` — a failed generation has
    // nothing behind it to open.
    if (item.status !== "done") return;
    router.push(localePath(locale, item.href));
  }

  function clearRejectReason(id: string) {
    setRejectReasons((r) => {
      if (!(id in r)) return r;
      const next = { ...r };
      delete next[id];
      return next;
    });
  }

  function stopReviewing(id: string) {
    setReviewing((s) => {
      if (!s.has(id)) return s;
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  function doPublish(item: ProfileItem, next: boolean) {
    setOpenMenu(null);
    // An MV going public is reviewed first, so it confirms; a song is immediate.
    if (next && item.kind === "mv") {
      setPubConfirm(item);
      return;
    }
    setPublished((s) => toggle(s, item.id));
    stopReviewing(item.id);
    clearRejectReason(item.id);
    showToast(next ? "Published success" : "Unpublished success");
  }

  // 2.5: the `?demo=1` panel's `publishRejected` flag decides what a submission
  // comes back as, same as `HistoryView.confirmPublishMv`. Rejection reverts
  // the item to unpublished (rule 2) rather than adding a fourth status.
  //
  // Product owner, 2026-08-28: submitting doesn't resolve immediately —
  // `reviewing` sits true (toggle OFF) for `PUBLISH_REVIEW_DELAY_MS`, then
  // either `published` flips true (toggle ON) or the reject reason lands,
  // same pending phase as `HistoryView`/`MvResult`. The flag/reason are
  // captured now, not re-read when the timer fires.
  function confirmPublish() {
    if (!pubConfirm) return;
    const id = pubConfirm.id;
    const rejected = demo.flags.publishRejected;
    const reason = demo.rejectReason;
    setReviewing((s) => new Set(s).add(id));
    clearRejectReason(id);
    showToast("Submitted for review");
    window.setTimeout(() => {
      stopReviewing(id);
      if (rejected) {
        setRejectReasons((r) => ({ ...r, [id]: reason }));
      } else {
        setPublished((s) => new Set(s).add(id));
      }
    }, PUBLISH_REVIEW_DELAY_MS);
    setPubConfirm(null);
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

  // MV only — a song's menu offers "Create MV" instead of "Edit" (see
  // `ProfileMenu`), so this is never reached for a song row and takes no
  // item. Unchanged from before this sync pass — pre-existing behavior,
  // not touched here.
  function doEdit() {
    setOpenMenu(null);
    router.push(localePath(locale, "/mv/edit"));
  }

  // Same two-step History's own `createMv` uses: seed the (in-memory,
  // reload-losable) MV flow with this row's data, then land on
  // `/mv/storyboard` (a storyboard resumes its own draft — same href the
  // card's own pill already opens) or `/mv/room` (a song starts a brand NEW
  // MV, seeded with its title/cover).
  function createMv(item: ProfileItem) {
    seedMvFlow({ id: item.id, title: item.title, thumb: item.cover });
    router.push(localePath(locale, item.isStoryboard ? item.href : "/mv/room"));
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
                      Start making AI music or music videos and they&apos;ll all show up in
                      one place.
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
              const isPublished = published.has(item.id);
              const isReviewing = reviewing.has(item.id);
              const itemRejectReason = rejectReasons[item.id];
              const menuOpen = openMenu === item.id;
              // HIST-06's rule, ported here: a failed OR still-generating
              // item is Delete-only — no Like / Share / Edit / Publish /
              // Download. A storyboard isn't either, but it isn't an MV yet
              // either, so it gets the same restricted set (plus its own
              // "Create MV").
              const failed = item.status === "failed";
              const generating = item.status === "generating";
              const restricted = failed || generating || item.isStoryboard;

              // The owner menu (Edit/Like/Share/Publish/Download/Delete,
              // trimmed per `restricted` above) — content unchanged from
              // before the MV preview redesign; the SHELL (below) is what's
              // new, synced onto History's own `.history-card__menu`.
              const menu = ownerMenu && (
                <ProfileMenu
                  item={item}
                  isLiked={isLiked}
                  isPublished={isPublished}
                  isReviewing={isReviewing}
                  rejectReason={itemRejectReason}
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
                  onPublish={(next) => doPublish(item, next)}
                  onEdit={doEdit}
                  onCreateMv={() => createMv(item)}
                />
              );

              const actions = restricted ? (
                <>
                  {/* Owner-only, same as the "..." menu below it — a visitor
                      browsing someone else's storyboard has no business
                      spinning off an MV from a draft that isn't theirs. */}
                  {item.isStoryboard && ownerMenu && (
                    <button
                      type="button"
                      className="button button--medium button--secondary"
                      onClick={() => createMv(item)}
                    >
                      <DpIcon name="ic_video_ai" className="button__icon button__icon--mask" />
                      <span className="button__label">Create MV</span>
                    </button>
                  )}
                  {menu}
                </>
              ) : (
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
                    // A storyboard is always the portrait crop Figma shows
                    // (nodes 1961:41956) — not left to `mvCoverRatio`'s index
                    // cycling, which would only get it right by coincidence.
                    ratio={item.isStoryboard ? "3:4" : mvCoverRatio(item.id)}
                    variant={
                      failed
                        ? "failed"
                        : generating
                          ? "generating"
                          : item.isStoryboard
                            ? "storyboard"
                            : "video"
                    }
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
                    {/* Failed / Generating — product owner, 2026-08-31 and
                        2026-09-01, Figma "Community User Profile — Song"
                        (1711:43159, 5th row Failed; the same row component's
                        own hidden `ic_timer` sibling is Generating's source):
                        the cover becomes a flat swatch with a muted icon (no
                        thumbnail to show), the subtitle becomes a plain kind
                        label, and the social row is replaced by DP's own
                        Failed/Processing badge beside the date — same badge
                        History already uses for both states (`DpBadge`). */}
                    <span
                      className={`community-profile__cover${
                        failed || generating ? " community-profile__cover--status" : ""
                      }${generating ? " community-profile__cover--generating" : ""}`}
                    >
                      {failed || generating ? (
                        <DpIcon
                          name={failed ? "ic_alert" : "ic_timer"}
                          className={`community-profile__cover-icon${
                            generating ? " community-profile__cover-icon--generating" : ""
                          }`}
                        />
                      ) : (
                        <>
                          <img src={item.cover} alt="" />
                          <DpIcon name="ic_song" />
                        </>
                      )}
                    </span>
                    <span className="community-profile__copy">
                      <strong>{item.title}</strong>
                      {failed || generating ? (
                        <>
                          <p className="community-profile__kind">AI Song</p>
                          <span className="community-profile__status-row">
                            <DpBadge status={failed ? "Failed" : "Processing"} />
                            <time>{item.date}</time>
                          </span>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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

      <PublishConfirmDialog
        open={pubConfirm != null}
        onCancel={() => setPubConfirm(null)}
        onConfirm={confirmPublish}
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
