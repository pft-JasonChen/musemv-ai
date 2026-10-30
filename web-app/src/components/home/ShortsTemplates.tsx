"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { HoverCta } from "@/components/ui/HoverCta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GuideHint } from "@/components/agent/GuideHint";
import { useEdgeFade } from "@/components/agent/useEdgeFade";
import {
  HOT_SKILLS,
  TEMPLATE_TABS,
  type AgentFlowId,
  type TemplateCard,
  type TemplateSection,
} from "@/lib/agent/content";

/**
 * Video Shorts templates — YCA's Creator / Marketer catalogue (handoff §1.3),
 * every rail drawn with the same 4:3 landscape card: the shared `Card`, Video ·
 * 4:3 · community off (Figma 5459:91262; product owner, 2026-10-28). Only the
 * first card of Drama (Pet Diary) and of Luxury Ads (Handbag Showcase) start a
 * demo; every other card is there as the catalogue and is deliberately inert.
 *
 * One row at a time (product owner, 2026-10-29): a tab per category picks
 * which rail shows, so the block is one card tall instead of eleven rails.
 * The chips replaced the Creator / Marketer tab bar — "Hot" (recommended
 * picks, 2026-10-30) first, then Creator's three categories and Marketer's
 * eight, in one scrollable row.
 *
 * Posters paint at once; a card's muted loop only plays while it is on screen
 * (`Card`'s `coverVideo`), so the page is not decoding dozens of clips at once.
 */
const CATEGORIES: TemplateSection[] = [HOT_SKILLS, ...TEMPLATE_TABS.flatMap((t) => t.rows)];

export function ShortsTemplates({ onStart }: { onStart: (flow: AgentFlowId) => void }) {
  const [active, setActive] = useState(0);
  const chipsRef = useEdgeFade<HTMLDivElement>();
  const row = CATEGORIES[active];

  return (
    <div className="shorts-tpl">
      {/* Same header as Home's other rails ("Trending Music Videos", …), so the
          block reads as a section. These are SKILLS, not templates — each card
          is a skill shown through a sample image / clip (product owner,
          2026-10-29). "See all" opens the full catalogue on /shorts. */}
      <SectionHeader title="Explore AI Shorts Skills" seeAllHref="/shorts" />
      {/* DP's Tabs component (Figma "Bar/Tabs", the History filter): pills,
          the selected one solid purple. `shorts-tpl__cats` only stops it
          wrapping, so eleven categories scroll in one row instead. */}
      <div ref={chipsRef} className="tabs shorts-tpl__cats edge-fade" role="tablist" aria-label="Skill categories">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.title}
            type="button"
            role="tab"
            aria-selected={active === i}
            className={`tabs__tab${active === i ? " tabs__tab--active" : ""}`}
            onClick={() => setActive(i)}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Keyed by category so a new rail starts scrolled to its first card. */}
      <Rail key={row.title} row={row} onStart={onStart} />
    </div>
  );
}

/** One row. Hovering it shows Previous / Next, exactly like Home's Trending MV
 *  and Top Picks rails (`NewMVsSection`): each appears only while there is
 *  something to scroll to that way, and a click pages one rail-width. */
function Rail({ row, onStart }: { row: TemplateSection; onStart: (flow: AgentFlowId) => void }) {
  const ref = useEdgeFade<HTMLDivElement>();
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setCanBack(el.scrollLeft > 1);
      setCanForward(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [ref]);

  const page = (direction: -1 | 1) => {
    const el = ref.current;
    el?.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section className="shorts-tpl__sec" role="tabpanel" aria-label={row.title}>
      <div className="shorts-tpl__row">
        <div ref={ref} className="shorts-tpl__rail edge-fade">
          {row.cards.map((c, k) => (
            <SkillTile key={k} card={c} onStart={onStart} />
          ))}
        </div>
        {canBack && (
          <div className="shorts-tpl__previous">
            <IconButton size="large" variant="ghost" icon="ic_arrow_left" label="Previous" onClick={() => page(-1)} />
          </div>
        )}
        {canForward && (
          <div className="shorts-tpl__next">
            <IconButton size="large" variant="ghost" icon="ic_arrow_right" label="Next" onClick={() => page(1)} />
          </div>
        )}
      </div>
    </section>
  );
}

/** Figma Card · Video · 4:3 · community off (5459:91262), via the shared `Card`.
 *  Shared with the /shorts catalogue grid (`className` sizes it there). */
export function SkillTile({
  card,
  onStart,
  className,
}: {
  card: TemplateCard;
  onStart: (flow: AgentFlowId) => void;
  className?: string;
}) {
  const flow = card.flow;
  return (
    <button
      type="button"
      className={`shorts-card${flow ? " shorts-card--live" : ""}${className ? ` ${className}` : ""}`}
      onClick={flow ? () => onStart(flow) : undefined}
      aria-label={card.label}
    >
      {/* The media box positions the CTA and hint on the card itself. */}
      <span className="shorts-card__media">
        <Card flat43 title={card.label} coverImage={card.poster} coverVideo={card.video} />
        {/* Hover CTA on every skill card (product owner, 2026-10-29). Drawn,
            not a nested button: the whole tile is the button, so this is
            decoration and the tile's label names it. Only cards with a `flow`
            start one in this prototype; on the rest it is drawn and inert. */}
        <HoverCta label="Use Skill" />
        {flow && <GuideHint show />}
      </span>
    </button>
  );
}
