"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DpIcon } from "@/components/ui/DpIcon";
import { useEdgeFade } from "@/components/agent/useEdgeFade";
import { AgentComposer } from "@/components/home/AgentComposer";
import { SkillTile } from "@/components/home/ShortsTemplates";
import {
  CATEGORY_DESC,
  RECENT_SHORTS,
  SHORTS_PLACEHOLDER,
  TEMPLATE_TABS,
  type AgentFlowId,
} from "@/lib/agent/content";

/**
 * `/shorts` — the AI Shorts landing page (product owner, 2026-10-29), reached
 * from the Sidebar and from Home's "Explore AI Shorts Skills → See all".
 *
 * Home and this page share the composer and the skill cards, so they are kept
 * apart by ROLE: Home is the entry point that samples everything (three mode
 * tabs, one horizontal rail per section); this is the AI Shorts workspace —
 *
 * · the composer without mode tabs, under its own "AI Shorts Agent" heading;
 * · "Recent": the user's last AI Shorts runs (placeholder data) with a link
 *   into History, which stays its own page;
 * · the WHOLE catalogue as a vertical grid, every category a section with a
 *   one-line description, behind a sticky category bar that follows the
 *   scroll (pollo.ai/agent's pattern, minus its history sidebar);
 * · once the composer scrolls away, a compact bar docks at the bottom and
 *   brings it back.
 *
 * Grid cards carry no description (2026-10-30): each plays its sample clip
 * while it is on screen (`Card`'s `coverVideo`), and the clip shows what the
 * skill makes. Only Pet Diary and Handbag Showcase start a demo, as on Home.
 */

type Category = {
  id: string;
  title: string;
  group: string;
  cards: (typeof TEMPLATE_TABS)[number]["rows"][number]["cards"];
};

/** Every category once, in Home's order. Home's rails list each card twice to
 *  read as a long rail; a grid would show the repeats, so only the first half. */
const CATEGORIES: Category[] = TEMPLATE_TABS.flatMap((tab) =>
  tab.rows.map((row) => ({
    id: `skills-${row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: row.title,
    group: tab.label,
    cards: row.cards.slice(0, row.cards.length / 2),
  })),
);

export function ShortsView() {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  const topRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);

  const start = (flow: AgentFlowId) =>
    requireLogin(() => router.push(localePath(locale, `/agent?flow=${flow}`)));

  // Dock the compact bar once the composer is out of view.
  useEffect(() => {
    const el = topRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setDocked(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const backToComposer = () => {
    const root = topRef.current;
    if (!root) return;
    root.scrollIntoView({ behavior: "smooth", block: "start" });
    const field = root.querySelector<HTMLElement>(".agent-composer__input, .agent-recipe [contenteditable]");
    window.setTimeout(() => field?.focus({ preventScroll: true }), 450);
  };

  return (
    <div className="shorts-page">
      <div ref={topRef} className="shorts-page__top">
        <AgentComposer variant="shorts" />
      </div>
      <RecentShorts onOpen={start} />
      <SkillCatalog onStart={start} />
      <div className={`shorts-dock${docked ? " shorts-dock--on" : ""}`} inert={!docked}>
        <button type="button" className="shorts-dock__bar" onClick={backToComposer}>
          <DpIcon name="ic_video_shorts" className="shorts-dock__icon" />
          <span className="shorts-dock__text">{SHORTS_PLACEHOLDER}</span>
          <span className="shorts-dock__go" aria-hidden="true">
            <DpIcon name="ic_arrow_right" className="shorts-dock__go-icon" />
          </span>
        </button>
      </div>
    </div>
  );
}

function RecentShorts({ onOpen }: { onOpen: (flow: AgentFlowId) => void }) {
  const { locale } = useLocale();
  return (
    <section className="shorts-recent" aria-labelledby="shorts-recent-title">
      {/* Home's section header classes (24px title, purple "See all"), as an
          h2 — the page needs a real heading outline under its h1. */}
      <div className="section-header">
        <h2 id="shorts-recent-title" className="section-header__title">
          Recent
        </h2>
        <Link href={localePath(locale, "/history?tab=shorts")} className="section-header__see-all">
          View all in History
          <DpIcon name="ic_chevron-right" className="section-header__see-all-icon" />
        </Link>
      </div>
      <div className="shorts-recent__list">
        {RECENT_SHORTS.map((r) => (
          <button key={r.id} type="button" className="shorts-recent__item" onClick={() => onOpen(r.flow)}>
            <img className="shorts-recent__thumb" src={r.poster} alt="" />
            <span className="shorts-recent__meta">
              <b>{r.title}</b>
              <span>
                {r.when} · Ready
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SkillCatalog({ onStart }: { onStart: (flow: AgentFlowId) => void }) {
  const navRef = useEdgeFade<HTMLDivElement>();
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(CATEGORIES[0].id);
  /** The category bar is pinned under the header — see `.shorts-cat__bar--stuck`. */
  const [stuck, setStuck] = useState(false);
  // While a chip-click glide is running, the scroll spy stays quiet so the
  // highlight does not flicker through every section it passes.
  const jumping = useRef<number | null>(null);

  // Scroll spy: the active category is the last section whose top has passed
  // the bottom of the sticky bar.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const bar = barRef.current;
      if (bar) setStuck(bar.getBoundingClientRect().top <= parseFloat(getComputedStyle(bar).top) + 0.5);
      if (jumping.current !== null) return;
      const line = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 24;
      let current = CATEGORIES[0].id;
      for (const c of CATEGORIES) {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= line) current = c.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [navRef]);

  // Keep the active chip in view inside the horizontally scrolling bar.
  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (!nav || !chip) return;
    const left = chip.offsetLeft - nav.clientWidth / 2 + chip.offsetWidth / 2;
    nav.scrollTo({ left, behavior: "smooth" });
  }, [active, navRef]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    const nav = navRef.current;
    if (!el || !nav) return;
    setActive(id);
    const top = el.getBoundingClientRect().top + window.scrollY - nav.getBoundingClientRect().height - 88;
    if (jumping.current !== null) window.clearTimeout(jumping.current);
    jumping.current = window.setTimeout(() => (jumping.current = null), 700);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section className="shorts-cat" aria-labelledby="shorts-cat-title">
      <div className="section-header">
        <h2 id="shorts-cat-title" className="section-header__title">
          All Skills
        </h2>
      </div>
      <div ref={barRef} className={`shorts-cat__bar${stuck ? " shorts-cat__bar--stuck" : ""}`}>
        <nav ref={navRef} className="tabs shorts-cat__nav edge-fade" aria-label="Skill categories">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              data-cat={c.id}
              aria-current={active === c.id ? "true" : undefined}
              className={`tabs__tab${active === c.id ? " tabs__tab--active" : ""}`}
              onClick={() => jump(c.id)}
            >
              {c.title}
            </button>
          ))}
        </nav>
      </div>

      {CATEGORIES.map((c) => (
        <section key={c.id} id={c.id} className="shorts-cat__sec" aria-labelledby={`${c.id}-title`}>
          <div className="shorts-cat__hd">
            <span className="shorts-cat__group">{c.group}</span>
            <h3 id={`${c.id}-title`} className="shorts-cat__name">
              {c.title}
            </h3>
            <p className="shorts-cat__desc">{CATEGORY_DESC[c.title]}</p>
          </div>
          <div className="shorts-cat__grid">
            {c.cards.map((card) => (
              <SkillTile
                key={card.slug}
                card={card}
                onStart={onStart}
                className="shorts-card--grid"
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
