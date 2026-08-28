"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { Tabs } from "@/components/shell/RoomNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { IconButton } from "@/components/ui/IconButton";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PublishConfirmDialog } from "@/components/ui/PublishConfirmDialog";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { buildShareUrl } from "@/lib/share";
import { downloadFile } from "@/lib/download";
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

export function CreatorProfile() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale } = useLocale();
  const { loggedIn } = useAuth();

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
    return demoEmpty ? [] : rows.filter((r) => !removed.has(r.id));
  }, [tab, removed, demoEmpty]);

  // Dismiss the open menu on an outside click or Escape — DP's behaviour, with
  // the listeners scoped to the open state so nothing is bound while closed.
  useEffect(() => {
    if (!openMenu) return;
    function onPointerDown(e: MouseEvent) {
      if (!(e.target as Element).closest(".community-profile__menu-shell")) setOpenMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  function open(item: ProfileItem) {
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

  function doEdit(item: ProfileItem) {
    setOpenMenu(null);
    router.push(localePath(locale, item.kind === "mv" ? "/mv/edit" : "/song/create"));
  }

  return (
    <>
      {/* `mobileTitle`, not `title`: DP's CommunityProfilePage passes the creator's
          name for the compact phone bar while keeping the desktop "‹ Back" text
          link. Passing `title` instead would switch the DESKTOP layout to
          icon-only-plus-centred-heading, which is a different screen. */}
      <DetailNavbar fallbackPath={self ? "/profile" : "/explore/mvs"} mobileTitle={name} />

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

              // The six-action owner menu (Edit/Like/Share/Publish/Download/
              // Delete) — unchanged from before the MV preview redesign, just
              // extracted so both the new `MvPreviewCard` (mv tab) and the
              // still-small song row (songs tab) render the SAME menu rather
              // than each carrying its own copy. See the class-level docs
              // above for why the item inside is an `<a>`, not a `<button>`.
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
                  {ownerMenu && (
                    <div className="community-profile__menu-shell">
                      {/* Designer fix, 2026-08-11: `size="small"` (28px), not
                          `xsmall` (20px) — CommunityProfilePage.css has no
                          dedicated "more" trigger class of its own (unlike
                          History's `.history-card__more`), so this leans on
                          IconButton's generic tertiary variant, which is
                          already the right white-15 pill fill; it just needs
                          the size History's own "more" button uses (28px) so
                          the two read the same size, not one visibly smaller
                          than the other. */}
                      <IconButton
                        size="small"
                        variant="tertiary"
                        icon="ic_more"
                        label="More"
                        onClick={() => setOpenMenu((c) => (c === item.id ? null : item.id))}
                      />
                      {menuOpen && (
                        <div className="community-profile__menu" role="menu">
                          {/* MV-13, same as HistoryView's menu: while an MV is
                              published or pending, this entry disappears
                              rather than becoming "Unpublish to edit" — the
                              Publish toggle below is the only way back to
                              editable. Songs never review (rule 3), so this
                              never hides for them. */}
                          {(item.kind !== "mv" || (!isPublished && !isReviewing)) && (
                            <a
                              role="menuitem"
                              className="community-profile__menu-primary"
                              href={localePath(
                                locale,
                                item.kind === "mv" ? "/mv/edit" : "/song/create",
                              )}
                              onClick={(e) => {
                                e.preventDefault();
                                doEdit(item);
                              }}
                            >
                              <DpIcon name="ic_edit" />
                              {item.kind === "mv" ? "Edit MV" : "Edit Song"}
                            </a>
                          )}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => setLiked((s) => toggle(s, item.id))}
                          >
                            <DpIcon name={isLiked ? "ic_favorite_on" : "ic_favorite_off"} />
                            {isLiked ? "Unlike" : "Like"}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenu(null);
                              setShare(item);
                            }}
                          >
                            <DpIcon name="ic_share" />
                            Share
                          </button>
                          <div className="community-profile__menu-publish">
                            <span>
                              <DpIcon as="i" name="ic_publish" />
                              {itemRejectReason ? (
                                // Same "History Menu / self-view profile Menu"
                                // Figma as HistoryView's own reject row (node
                                // 2695:117710) — identical treatment, shared
                                // class names.
                                <span className="history-card__menu-publish-text">
                                  <span className="history-card__menu-publish-title">
                                    Publish <em>(Rejected)</em>
                                  </span>
                                  <span className="history-card__menu-publish-reason">
                                    {publishRejectLabel(itemRejectReason)}
                                  </span>
                                </span>
                              ) : (
                                "Publish"
                              )}
                            </span>
                            <ToggleSwitch
                              checked={isPublished}
                              onChange={(next) => doPublish(item, next)}
                              ariaLabel={`Publish ${item.title}`}
                            />
                          </div>
                          <button type="button" role="menuitem" onClick={() => doDownload(item)}>
                            <DpIcon name="ic_download" />
                            Download
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="community-profile__menu-delete"
                            onClick={() => {
                              setOpenMenu(null);
                              setDel(item);
                            }}
                          >
                            <DpIcon name="ic_delete" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
