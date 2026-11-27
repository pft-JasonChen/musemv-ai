"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { DpIcon } from "@/components/ui/DpIcon";
import { HoverCta } from "@/components/ui/HoverCta";
import { StylePreviewDialog } from "./StylePreviewDialog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useToast } from "@/components/ui/Toast";
import { GuideHint } from "@/components/agent/GuideHint";
import { useEdgeFade } from "@/components/agent/useEdgeFade";
import { revealInRow } from "@/lib/revealInRow";
import {
  HOT_SKILLS,
  TEMPLATE_TABS,
  type AgentFlowId,
  type TemplateCard,
} from "@/lib/agent/content";
import type { HeroCard } from "./HeroBannerSectionV3";
import { HERO_ITEMS } from "./heroItems";
import { RailFrame } from "./ShortsTemplates";

/**
 * Home's Explore row (home redesign, 2026-11-26): one row that mixes Music
 * Video styles and AI Shorts skills, so the first thing under the composer is
 * not any one product's catalogue (CEO feedback: Home leaned on AI Shorts).
 * It no longer follows the composer's tab.
 *
 * TWO LEVELS OF CHIPS (design critique, 2026-11-27). Level 1 names what you
 * get: Featured · Music Video · Creator Video · Marketing Video — AI Shorts'
 * two groups (the Creator / Marketer split its catalogue already has) named
 * like "Music Video" (product owner, 2026-11-27). Level 2 — that group's own
 * categories, "All" first — shows only under Creator Video / Marketing Video.
 * A single flat row had 12 of its 14 chips from one product and mixed products
 * with categories. "Featured" is the cross-product mix (Music Video styles +
 * the Hot skills), so there is no "Hot" chip and no "All" at level 1.
 *
 * Both kinds are drawn as the AI Shorts skill card (4:3, the shared `Card`,
 * `.shorts-card`) so the row has one shape; a small product icon on every card
 * says which product it belongs to, and the subtitle stays the mood (Music
 * Video) or the category (AI Shorts). Song styles are NOT here (product owner).
 *
 * A Music Video card opens the style preview (the parent shows it, and "Use
 * Style" loads it into the composer); a skill card starts its Agent flow when it
 * has one — the same two live demos as before — and is otherwise inert.
 *
 * Title names which product each kind belongs to ("Styles" are Music Video's,
 * "Skills" AI Shorts'). Copy is a placeholder.
 */
type Product = "featured" | "mv" | "creator" | "marketing";
const PRODUCTS: { id: Product; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "mv", label: "Music Video" },
  { id: "creator", label: "Creator Video" },
  { id: "marketing", label: "Marketing Video" },
];
/** AI Shorts' two groups and their categories, as `/shorts` lists them. */
const GROUP_ROWS = {
  creator: TEMPLATE_TABS.find((t) => t.id === "creator")!.rows,
  marketing: TEMPLATE_TABS.find((t) => t.id === "marketer")!.rows,
};
const isGroup = (p: Product): p is "creator" | "marketing" => p === "creator" || p === "marketing";
const ALL = "all";
/** Every card's category lookup and the live-demo list read the whole catalogue. */
const CATEGORIES = [HOT_SKILLS, ...TEMPLATE_TABS.flatMap((t) => t.rows)];
/** A skill's own category — what its card's subtitle says ("Drama", "Luxury
 *  Ads", …). `Hot` is a pick list, so it is skipped. */
const CATEGORY_OF = new Map(
  TEMPLATE_TABS.flatMap((t) => t.rows).flatMap((r) => r.cards.map((c) => [c.slug, r.title])),
);

/** The skills that start a demo today, by name — for the tester notice below. */
const LIVE_SKILLS = Array.from(
  new Set(
    CATEGORIES.flatMap((c) => c.cards)
      .filter((c) => c.flow)
      .map((c) => c.label),
  ),
);
const NOT_IN_DEMO = `This skill is not part of the demo. Try ${LIVE_SKILLS.join(" or ")}.`;

type Tile =
  | { kind: "mv"; key: string; card: HeroCard; mood: string }
  | { kind: "shorts"; key: string; card: TemplateCard };

export function ExploreRow({
  onStyle,
  onSkill,
}: {
  /** "Use Style": load a Music Video style into the composer. */
  onStyle: (card: HeroCard) => void;
  onSkill: (flow: AgentFlowId) => void;
}) {
  const [product, setProduct] = useState<Product>("featured");
  const [category, setCategory] = useState(ALL);
  const { show: showToast, toast } = useToast(3600);
  // The card whose ▶ was pressed: its preview opens in the shared dialog.
  const [preview, setPreview] = useState<{
    card: HeroCard;
    kind: "mv" | "shorts";
    flow?: AgentFlowId;
  } | null>(null);
  /** A skill with no flow is a catalogue card: tell testers it is out of the
   *  demo's scope rather than leave the click silent. */
  const startSkill = (flow?: AgentFlowId) => (flow ? onSkill(flow) : showToast(NOT_IN_DEMO));
  const chipsRef = useEdgeFade<HTMLDivElement>();
  // The sub-chip row only exists for a group and holds that group's categories,
  // so its fade is re-attached when the group changes.
  const subRef = useEdgeFade<HTMLDivElement>(isGroup(product) ? product : null);

  const { mv, shorts } = useMemo(() => {
    const seen = new Set<string>();
    return {
      mv: HERO_ITEMS.map<Tile>((h) => ({
        kind: "mv",
        key: h.id,
        card: h,
        mood: h.subtitle.split("|")[0].trim(),
      })),
      // `HOT_SKILLS` repeats its slugs to fill a rail; a mixed row wants each once.
      shorts: HOT_SKILLS.cards
        .filter((c) => !seen.has(c.slug) && seen.add(c.slug))
        .map<Tile>((c) => ({ kind: "shorts", key: c.slug, card: c })),
    };
  }, []);

  // Featured: one of each in turn, so neither product runs on.
  const tiles = useMemo(() => {
    if (product === "mv") return mv;
    if (isGroup(product)) {
      const rows = GROUP_ROWS[product];
      if (category !== ALL) {
        const row = rows.find((r) => r.title === category);
        return (row?.cards ?? []).map<Tile>((c, i) => ({
          kind: "shorts",
          key: `${c.slug}-${i}`,
          card: c,
        }));
      }
      // The whole group: each skill once (a category's own rail repeats its
      // slugs to fill itself).
      const seen = new Set<string>();
      return rows
        .flatMap((r) => r.cards)
        .filter((c) => !seen.has(c.slug) && seen.add(c.slug))
        .map<Tile>((c) => ({ kind: "shorts", key: c.slug, card: c }));
    }
    const out: Tile[] = [];
    for (let i = 0; i < Math.max(mv.length, shorts.length); i++) {
      if (mv[i]) out.push(mv[i]);
      if (shorts[i]) out.push(shorts[i]);
    }
    return out;
  }, [product, category, mv, shorts]);

  return (
    <section className="shorts-tpl home-explore">
      <SectionHeader
        title="Explore Music Video Styles & AI Shorts Skills"
        mobileTitle="MV Styles & Shorts Skills"
        seeAllHref={isGroup(product) ? "/shorts" : undefined}
      />
      <div
        ref={chipsRef}
        className="tabs shorts-tpl__cats edge-fade"
        role="tablist"
        aria-label="Explore"
      >
        {PRODUCTS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={product === c.id}
            className={`tabs__tab${product === c.id ? " tabs__tab--active" : ""}`}
            onClick={(e) => {
              revealInRow(e.currentTarget);
              setProduct(c.id);
              setCategory(ALL);
              // "All" is first in the sub row; a new group starts at its start.
              if (subRef.current) subRef.current.scrollLeft = 0;
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {/* Level 2: the open group's categories, "All" first. */}
      {isGroup(product) && (
        <div
          ref={subRef}
          className="home-explore__sub edge-fade"
          role="tablist"
          aria-label={`${PRODUCTS.find((c) => c.id === product)!.label} categories`}
        >
          {[
            { title: "All", id: ALL },
            ...GROUP_ROWS[product].map((r) => ({ title: r.title, id: r.title })),
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              className={`home-explore__sub-tab${category === c.id ? " home-explore__sub-tab--on" : ""}`}
              onClick={(e) => {
                revealInRow(e.currentTarget);
                setCategory(c.id);
              }}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}
      {/* Keyed by selection so a new set starts scrolled to its first card. */}
      <RailFrame
        key={`${product}:${isGroup(product) ? category : ""}`}
        label={PRODUCTS.find((c) => c.id === product)!.label}
      >
        {tiles.map((t) =>
          t.kind === "mv" ? (
            <ExploreTile
              key={t.key}
              title={t.card.title}
              sub={t.mood}
              product="mv"
              poster={t.card.thumbnail}
              video={t.card.video}
              cta="Use Style"
              live
              onUse={() => onStyle(t.card)}
              onPlay={() => setPreview({ card: t.card, kind: "mv" })}
            />
          ) : (
            <ExploreTile
              key={t.key}
              title={t.card.label}
              sub={CATEGORY_OF.get(t.card.slug) ?? t.card.label}
              product="shorts"
              poster={t.card.poster}
              video={t.card.video}
              cta="Use Skill"
              live={!!t.card.flow}
              onUse={() => startSkill(t.card.flow)}
              onPlay={() =>
                setPreview({
                  kind: "shorts",
                  flow: t.card.flow,
                  card: {
                    id: t.card.slug,
                    title: t.card.label,
                    subtitle: CATEGORY_OF.get(t.card.slug) ?? t.card.label,
                    thumbnail: t.card.poster,
                    video: t.card.video,
                  },
                })
              }
            />
          ),
        )}
      </RailFrame>
      {toast}
      <StylePreviewDialog
        card={preview?.card ?? null}
        useLabel={preview?.kind === "shorts" ? "Use this Skill" : "Use this Style"}
        onClose={() => setPreview(null)}
        onUse={(c) => {
          const was = preview;
          setPreview(null);
          if (was?.kind === "shorts") startSkill(was.flow);
          else onStyle(c);
        }}
      />
    </section>
  );
}

/** `ShortsTemplates`' `SkillTile`, for either product. Hover shows the pill
 *  CTA with a ▶ beside it (the Music Video strip's pairing). The CTA uses the
 *  card right away; the ▶ — and a click anywhere else on the card — opens the
 *  preview, where "Use this Style / Skill" confirms it (product owner,
 *  2026-11-27). Two real buttons cannot live inside a button, so the tile is a
 *  div, with an invisible full-card button under the controls so a tap on a
 *  touch screen (no hover) opens the preview too. That button is not a tab stop:
 *  the ▶ is the keyboard route to the same preview. */
function ExploreTile({
  title,
  sub,
  poster,
  video,
  cta,
  product,
  live,
  onUse,
  onPlay,
}: {
  title: string;
  sub: string;
  poster: string;
  video?: string;
  cta: string;
  product: "mv" | "shorts";
  /** Starts something today (a Music Video style, or a skill with a demo). */
  live: boolean;
  onUse: () => void;
  onPlay: () => void;
}) {
  return (
    <div className="shorts-card shorts-card--live">
      <span className="shorts-card__media">
        <Card flat43 title={title} subtitle={sub} coverImage={poster} coverVideo={video} />
        <button
          type="button"
          className="home-explore__hit"
          tabIndex={-1}
          aria-hidden="true"
          onClick={onPlay}
        />
        {/* Which product — an icon, so the subtitle can stay the mood or the
            category. Decoration: the CTA's name says it. */}
        <span className="home-explore__badge" aria-hidden="true">
          <DpIcon
            name={product === "mv" ? "ic_video_ai" : "ic_video_shorts"}
            className="home-explore__badge-icon"
          />
        </span>
        <div className="hover-cta-group">
          <HoverCta label={cta} onClick={onUse} />
          <button
            type="button"
            className="hover-cta-play"
            aria-label={`Play ${title}`}
            onClick={onPlay}
          >
            <DpIcon name="ic_play" className="hover-cta-play__icon" />
          </button>
        </div>
        {live && product === "shorts" && <GuideHint show />}
      </span>
    </div>
  );
}
