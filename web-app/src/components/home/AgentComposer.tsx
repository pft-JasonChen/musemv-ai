"use client";
/* eslint-disable @next/next/no-img-element */

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DpIcon } from "@/components/ui/DpIcon";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { GuideHint } from "@/components/agent/GuideHint";
import { useHomeLayout } from "@/lib/homeLayout";
import { DanceStyleSheet } from "@/components/agent/DanceStyleSheet";
import { LinkSheet } from "@/components/agent/LinkSheet";
import { PhotoPicker } from "@/components/agent/PhotoPicker";
import { useEdgeFade } from "@/components/agent/useEdgeFade";
import {
  AGENT_PROMPT_KEY,
  DEMO_URL,
  IMG,
  PICK_CELL,
  SHORTS_PLACEHOLDER,
  SHORTS_SKILL_GROUPS,
  type ShortsSkillGroupId,
} from "@/lib/agent/content";
import { SHORTS_IDEA_PROMPTS } from "@/lib/agent/shortsIdeas";
import { pickIdea } from "@/lib/mv/songIdeas";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { type HeroCard } from "./HeroBannerSectionV3";
import { HERO_ITEMS } from "./heroItems";
import { DanceRecipeEditor, RecipeEditor } from "./RecipeEditor";
import { MvInput, type MvPick } from "./MvInput";
import { SongInput } from "./SongInput";
import { ExploreRow } from "./ExploreRow";
import { ContinueRow } from "./ContinueRow";

/**
 * Home's Agent composer (feature/video-agent-home) — replaces the two tool
 * cards with one large prompt input, competitor-style, behind a three-way
 * mode switch: Music Video › Song › Video Shorts.
 *
 * · Music Video is an entry point into the EXISTING flow: Create takes you to
 *   `/mv/room` behind the same `requireLogin` gate the cards had (AC-EXP-02).
 *   The typed text is not carried over yet.
 * · Song is the whole `/song/create` form in the card (`SongInput`,
 *   2026-10-30): Custom / Simple, Instrumental, Song Style, Idea, Enhance, and
 *   a Create that starts the real generation. Its "Use" sets the Song Style
 *   picks and the starter in `songCompose` rather than this file's own state.
 * · Video Shorts is the YCA launcher (handoff §1): skill pills sit under the
 *   input in three groups — Creative, UGC, Product Ads (2026-11-18) — and
 *   `UGC Talking Review` (in UGC) turns the input into its recipe — Model /
 *   Product slots plus "Create a UGC before-and-after video for … featuring …".
 *   Send lights up as soon as the recipe is on, whatever is still missing; the
 *   Agent asks for it in chat. The other eight skills are deliberately inert.
 *   The recipe is one editable prompt with the chips inline, pollo.ai-style
 *   (2026-10-28): see `RecipeEditor`.
 * · `+` opens the same photo picker as the slots: in the recipe it fills the
 *   first empty slot, elsewhere the photo is attached to the prompt.
 * · Idea and Enhance (Figma 5559:194908, 2026-10-30) work on the plain prompt
 *   only, as on the other two tabs: Idea writes a placeholder prompt, Enhance
 *   appears once there is text. Both step aside while the recipe is on — its
 *   sentence is fixed and its gaps are chips. Enhance asks for the
 *   `storyboard` kind (a video-scene rewrite): `EnhanceKind` is C1, frozen,
 *   so AI Shorts gets no kind of its own here.
 *   The template rails below (Creator / Marketer) start the other two demos.
 * · Under Music Video and Song the old hero filmstrip returns as a smaller
 *   inspiration row (hero MVs / Top Picks songs): its CTA, "Use",
 *   loads the card into the prompt (a Style chip + a starter sentence) rather
 *   than navigating (2026-10-28).
 *
 * · `variant="shorts"` is the same composer on the AI Shorts landing page
 *   (`/shorts`, 2026-10-29): no mode switch (it only does AI Shorts), its own
 *   heading, and nothing rendered under it — that page lays out its own
 *   catalogue.
 *
 * Draft styling: the mobile layout follows the Figma chat-based draft
 * (Guideline_YCM 4854:71391) and the desktop one the reference the product
 * owner supplied; both are to be restyled when the final Figma lands.
 */

type Mode = "mv" | "song" | "shorts";
export type HomeMode = Mode;

/** What Home opens on before the user has picked anything, per layout (see
 *  `lib/homeLayout`). B, the tab bar: Music Video, not the first tab (home
 *  redesign, 2026-11-26) — CEO feedback was that Home leaned on AI Shorts and
 *  the MV is the flagship; the tab ORDER is unchanged. A, Music Video and Song
 *  as pills: nothing selected (product owner, 2026-11-27) — AI Shorts' own
 *  prompt, with no pill filled. */
const FIRST_VISIT_MODE: Record<"A" | "B", Mode> = { A: "shorts", B: "mv" };

/**
 * The Home composer tab last picked, for the lifetime of the document
 * (product owner, 2026-11-02): open a card, "See all" or a create screen and
 * come back, and Home is on the tab you left — not reset to the first tab.
 * Module scope, like History's `rememberedFilter`: it survives client-side
 * navigation and resets on a real page load, which also keeps the first
 * render identical to the server's (`FIRST_VISIT_MODE`).
 */
let rememberedMode: Mode | null = null;
const rememberMode = (m: Mode) => {
  rememberedMode = m;
};
type Product = { type: "photo" } | { type: "url"; url: string } | null;

const MODES: { id: Mode; label: string; icon: string; placeholder: string; href?: string }[] = [
  // AI Shorts first (product owner, 2026-10-30).
  { id: "shorts", label: "AI Shorts", icon: "ic_video_shorts", placeholder: SHORTS_PLACEHOLDER },
  {
    id: "mv",
    label: "Music Video",
    icon: "ic_video_ai",
    placeholder: "Describe the mood, story, characters, or visuals you want for your MV...",
    href: "/mv/room",
  },
  {
    id: "song",
    label: "Song",
    icon: "ic_song_ai",
    placeholder: "Describe your lyrics or song idea here...",
    href: "/song/create",
  },
];

export function AgentComposer({
  variant = "home",
  onModeChange,
}: {
  variant?: "home" | "shorts";
  /** Called when the user switches to a DIFFERENT tab (never on mount, never
   *  on a click on the tab already open) — Home uses it to replay the
   *  fade-up on every section below the tab bar. */
  onModeChange?: () => void;
} = {}) {
  const solo = variant === "shorts";
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  // Home resumes the tab the user left it on (see `rememberedMode`); /shorts
  // only ever does AI Shorts.
  // Layout A (pills) or B (tab bar) — see `lib/homeLayout`.
  const layout = useHomeLayout();
  const PILL_MODES = layout === "A";
  // The mode the user picked; null until they do. Until then Home follows the
  // layout's own default (A: nothing selected; B: Music Video), including when
  // the layout is switched — derived, not copied into state, so a stored B is
  // picked up after hydration without a mismatch. The server and the first
  // client render are layout A.
  const [picked, setPicked] = useState<Mode | null>(() => (solo ? "shorts" : rememberedMode));
  const mode: Mode = picked ?? FIRST_VISIT_MODE[layout];
  const setMode = (m: Mode) => {
    if (m === mode) return;
    if (!solo) rememberMode(m);
    setPicked(m);
    onModeChange?.();
  };
  const { compose, patchCompose } = useMvFlow();
  /** What the MV tab's Templates button shows: a template or a hero style. */
  const [mvPick, setMvPick] = useState<MvPick | null>(null);

  const [text, setText] = useState<Record<Mode, string>>({ mv: "", song: "", shorts: "" });
  /** The skill recipe loaded into the prompt: UGC Talking Review's or, since
   *  2026-11-18, Dance Video's (YCA mockup). */
  const [recipe, setRecipe] = useState<"ugc" | "dance" | null>(null);
  /** Dance Video's two chips: the character photo and the dance style. */
  const [character, setCharacter] = useState(false);
  const [danceStyle, setDanceStyle] = useState<string | null>(null);
  const [styleOpen, setStyleOpen] = useState(false);
  /** The skill group opened under the card; null shows the three group pills. */
  const [skillGroup, setSkillGroup] = useState<ShortsSkillGroupId | null>(null);
  const [product, setProduct] = useState<Product>(null);
  const [model, setModel] = useState(false);
  const [attached, setAttached] = useState<Record<Mode, number>>({ mv: 0, song: 0, shorts: 0 });
  const [picker, setPicker] = useState<"model" | "product" | "character" | "attach" | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  /** Music Video / Song: the inspiration card whose style was loaded into the prompt. */
  const [styles, setStyles] = useState<Record<InspoMode, Inspiration | null>>({
    mv: null,
    song: null,
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modesRef = useEdgeFade<HTMLDivElement>();
  const skillsRef = useEdgeFade<HTMLDivElement>();

  // The card's height follows its content — a tab with a song slot, a photo
  // attached, Custom ↔ Simple — and everything below it moves with it. Rather
  // than jump, run the change as an animation from the old height to the new
  // one (product owner, 2026-11-27) — the box's border and the bar along its
  // bottom edge on one clock. The layout is already at the new height
  // when the observer fires; the animation only overrides what is painted, so
  // it can be cancelled or skipped at no cost. `overflow: hidden` for its 300ms
  // keeps the NEW content inside the growing box, then goes (popovers need it).
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let last = el.getBoundingClientRect().height;
    let running: Animation | null = null;
    const ro = new ResizeObserver(() => {
      if (running) return; // the animation itself resizes the box
      const h = el.getBoundingClientRect().height;
      const from = last;
      last = h;
      if (Math.abs(h - from) < 2) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      el.style.overflow = "hidden";
      const timing = { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
      // The controls row sits at the card's bottom edge. Left alone it would
      // jump while the border glides — or not, if the tab's layout already pins
      // it to the bottom. So measure instead of assuming: how far the bar is
      // from the bottom edge at its final height, and how far once the box is
      // back at its old height. Offset the bar by the difference and let it
      // settle on the same clock as the box.
      const bar = el.querySelector<HTMLElement>(".agent-composer__bar");
      const gap = () =>
        el.getBoundingClientRect().bottom - (bar?.getBoundingClientRect().bottom ?? 0);
      const finalGap = bar ? gap() : 0;
      const a = el.animate([{ height: `${from}px` }, { height: `${h}px` }], timing);
      if (bar) {
        const offset = gap() - finalGap;
        if (Math.abs(offset) >= 1) {
          bar.animate([{ transform: `translateY(${offset}px)` }, { transform: "none" }], timing);
        }
      }
      running = a;
      const done = () => {
        running = null;
        el.style.overflow = "";
        last = el.getBoundingClientRect().height;
      };
      a.onfinish = done;
      a.oncancel = done;
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      running?.cancel();
    };
  }, []);

  const current = MODES.find((m) => m.id === mode)!;
  // The skills row is open on the AI Shorts tab — and on every tab when Music
  // Video and Song are pills in it.
  const skillsOpen = solo || PILL_MODES || mode === "shorts";

  // Music Video inspiration (2026-10-28): a style's "Use Style" loads it into
  // the prompt and brings the composer back into view, instead of leaving Home.
  // Text the user already typed is kept; an empty prompt (or one we filled from
  // an earlier card) gets a starter sentence. The Explore row serves every tab
  // (2026-11-26), so this also switches the composer to Music Video.
  const applyStyle = (card: HeroCard) => {
    const item = INSPIRATION.mv.find((i) => i.id === card.id);
    if (!item) return;
    const prev = styles.mv;
    const keep = (t: string) => t.trim() !== "" && !(prev && t === prev.starter);
    // The MV tab's prompt is `compose.description` (MvInput, 2026-10-30) —
    // the one `/mv/room` reads; the card shows on its Templates button.
    const kept = keep(compose.description);
    if (!kept) patchCompose({ description: item.starter });
    setMvPick({
      cover: item.thumbnail,
      name: item.title,
      prompt: kept ? undefined : item.starter,
    });
    setStyles((st) => ({ ...st, mv: item }));
    setMode("mv");
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };
  const inRecipe = mode === "shorts" && recipe !== null;
  const go = (path: string) => requireLogin(() => router.push(localePath(locale, path)));

  // A skill pill turns its recipe on, or off if it is already on; switching
  // to the other recipe starts it fresh.
  const toggleRecipe = (kind: "ugc" | "dance") => {
    setRecipe((on) => (on === kind ? null : kind));
    setProduct(null);
    setModel(false);
    setCharacter(false);
    setDanceStyle(null);
  };

  // Skill row motion (product owner, 2026-11-18). Opening or closing a group
  // measures every pill first; once React has re-rendered the row, pills that
  // stayed slide over from where they were (FLIP) and new ones fade in from
  // the left one after another. Leaving pills go at once — the arrivals carry
  // the change. Reduced motion: no animation.
  const skillRects = useRef<Map<string, DOMRect> | null>(null);
  const toggleSkillGroup = (id: ShortsSkillGroupId) => {
    const row = skillsRef.current;
    if (row) {
      skillRects.current = new Map(
        Array.from(row.querySelectorAll<HTMLElement>("[data-skill]"), (el) => [
          el.dataset.skill!,
          el.getBoundingClientRect(),
        ]),
      );
    }
    // A group is an AI Shorts skill: opening one from the Music Video or Song
    // composer switches the composer to AI Shorts first.
    if (mode !== "shorts") setMode("shorts");
    setSkillGroup((open) => (open === id ? null : id));
  };

  useLayoutEffect(() => {
    const row = skillsRef.current;
    const before = skillRects.current;
    skillRects.current = null;
    if (!row || !before) return;
    // Every change starts the row at its left edge (an open group overflows
    // on phones), and the scroll event makes the edge fade re-measure: the
    // hook only listens for scrolls and resizes, and new content is neither.
    row.scrollLeft = 0;
    row.dispatchEvent(new Event("scroll"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let arrival = 0;
    for (const el of row.querySelectorAll<HTMLElement>("[data-skill]")) {
      const was = before.get(el.dataset.skill!);
      if (was) {
        const dx = was.left - el.getBoundingClientRect().left;
        if (Math.abs(dx) > 0.5) {
          el.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], {
            duration: 280,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          });
        }
      } else {
        el.animate(
          [
            { opacity: 0, transform: "translateX(-8px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 220, delay: 60 + arrival++ * 40, easing: "ease-out", fill: "backwards" },
        );
      }
    }
  }, [skillGroup, skillsRef]);

  /** A pill clicked while partly under the row's faded edge (`.edge-fade`,
   *  56px) scrolls fully into view; at the row's ends `scrollBy` clamps. */
  const revealSkill = (el: HTMLElement) => {
    const row = skillsRef.current;
    if (!row) return;
    const pill = el.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    const left = pill.left - (box.left + 56);
    const right = pill.right - (box.right - 56);
    if (left < 0) row.scrollBy({ left, behavior: "smooth" });
    else if (right > 0) row.scrollBy({ left: right, behavior: "smooth" });
  };

  // AI Shorts sends a UGC Talking Review recipe, or — since 2026-10-30 — a free
  // prompt, which opens the Agent on it (`fromPrompt` in flows.ts). Dance
  // Video's recipe opens its own script (`dance`, 2026-11-18) with what its
  // chips hold: whether a character photo was picked, and the style.
  const canSend = mode === "shorts" ? recipe !== null || text.shorts.trim() !== "" : true;
  const send = () => {
    if (!canSend) return;
    if (mode !== "shorts") return go(current.href!);
    if (recipe === "ugc") return go(`/agent?flow=ugc&product=${product ? product.type : "none"}`);
    if (recipe === "dance") {
      const style = danceStyle ? `&style=${encodeURIComponent(danceStyle)}` : "";
      return go(`/agent?flow=dance&character=${character ? 1 : 0}${style}`);
    }
    requireLogin(() => {
      try {
        sessionStorage.setItem(AGENT_PROMPT_KEY, text.shorts.trim());
      } catch {
        // Storage blocked: the Agent falls back to its default flow.
      }
      router.push(localePath(locale, "/agent?flow=prompt"));
    });
  };

  const openAdd = () =>
    setPicker(
      !inRecipe
        ? "attach"
        : recipe === "dance"
          ? "character"
          : !model
            ? "model"
            : !product
              ? "product"
              : "model",
    );

  // Guide (handoff §3.1, round 0): UGC Talking Review → Product URL → send. The
  // model is left empty on purpose — the Agent asks for it. Step 1 ("pill")
  // also leads to Creative → Dance Video (2026-11-18); its recipe has no
  // later steps.
  const hint =
    mode !== "shorts"
      ? null
      : recipe === null
        ? "pill"
        : recipe === "ugc"
          ? !product
            ? "url"
            : "send"
          : null;

  // The templates are a SIBLING of the composer, not inside it: the composer
  // keeps its 920px column while the rails run the full width of Home's other
  // sections (product owner, 2026-10-28).
  return (
    <>
      <section className={`agent-composer${solo ? " agent-composer--shorts" : ""}`}>
        {solo ? (
          <div className="agent-composer__intro">
            <h1 className="tool-selector-v3__heading agent-composer__heading">AI Shorts Agent</h1>
            <p className="agent-composer__lede">
              Pick a skill or describe your idea — the Agent plans the script, storyboard and video
              with you.
            </p>
          </div>
        ) : (
          <h1 className="tool-selector-v3__heading agent-composer__heading">
            {/* Phones get the shorter line, which fits on one line at 320px
                (product owner, 2026-10-30); CSS shows one or the other.
                Since 2026-11-18 the heading loops between the question and
                its answer — what you can make here — with a fade-up
                (`.agent-composer__line`, CSS only). Both lines share one grid
                cell, so the heading keeps the taller one's height and the
                swap never moves the page. The answer is aria-hidden: the
                h1's accessible name stays the question. */}
            <span className="agent-composer__lines">
              <span className="agent-composer__line agent-composer__line--ask">
                <span className="agent-composer__heading-full">
                  What would you like to create today?
                </span>
                <span className="agent-composer__heading-short">What will you create today?</span>
              </span>
              <span
                className="agent-composer__line agent-composer__line--answer"
                aria-hidden="true"
              >
                {/* Broken after the comma, so "Music Videos" stays together. */}
                <span className="agent-composer__heading-full">
                  Create AI Shorts,
                  <br />
                  Music Videos and Songs
                </span>
                <span className="agent-composer__heading-short">
                  Shorts, Music Videos &amp; Songs
                </span>
              </span>
            </span>
          </h1>
        )}

        {!solo && !PILL_MODES && (
          <div
            ref={modesRef}
            className="agent-composer__modes edge-fade"
            role="tablist"
            aria-label="Create"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                className={`agent-composer__mode${mode === m.id ? " agent-composer__mode--on" : ""}`}
                onClick={() => setMode(m.id)}
              >
                <DpIcon name={m.icon} className="agent-composer__mode-icon" />
                {m.label}
              </button>
            ))}
          </div>
        )}

        <div
          className={`agent-composer__card${mode === "song" ? " agent-composer__card--song" : ""}`}
          ref={cardRef}
        >
          {mode === "song" ? (
            <SongInput
              inputRef={inputRef}
              starter={styles.song?.starter}
              onStyleClear={() => setStyles((st) => ({ ...st, song: null }))}
            />
          ) : mode === "mv" ? (
            <MvInput
              inputRef={inputRef}
              pick={mvPick}
              onPick={(p) => {
                setMvPick(p);
                if (!p) setStyles((st) => ({ ...st, mv: null }));
              }}
            />
          ) : (
            <>
              {inRecipe && recipe === "dance" ? (
                // Dance Video (YCA mockup, 2026-11-18): a character photo
                // slot once picked, then the sentence with its two chips.
                <div className="agent-recipe">
                  {character && (
                    <div className="agent-recipe__slots">
                      <PhotoSlot
                        label="Character"
                        src={IMG.picked}
                        showLabel
                        onPick={() => setPicker("character")}
                        onClear={() => setCharacter(false)}
                      />
                    </div>
                  )}
                  <DanceRecipeEditor
                    character={character}
                    style={danceStyle}
                    onChip={(t) => (t === "style" ? setStyleOpen(true) : setPicker("character"))}
                    onRemoved={(slot) =>
                      slot === "style" ? setDanceStyle(null) : setCharacter(false)
                    }
                    onEnter={send}
                  />
                </div>
              ) : inRecipe ? (
                <div className="agent-recipe">
                  {/* A slot appears only once it holds a photo (2026-10-28): empty
                  placeholders duplicated the inline "+ Model Image" / "+ Product
                  image" chips, which remain the way to add one. */}
                  {(model || product) && (
                    <div className="agent-recipe__slots">
                      {model && (
                        <PhotoSlot
                          label="Model"
                          src={IMG.picked}
                          showLabel
                          onPick={() => setPicker("model")}
                          onClear={() => setModel(false)}
                        />
                      )}
                      {product && (
                        <PhotoSlot
                          label="Product"
                          src={IMG.product}
                          fit
                          showLabel
                          onPick={() => setPicker("product")}
                          onClear={() => setProduct(null)}
                        />
                      )}
                    </div>
                  )}
                  <RecipeEditor
                    product={product}
                    model={model}
                    hintUrl={hint === "url"}
                    onChip={(t) => (t === "url" ? setLinkOpen(true) : setPicker(t))}
                    onRemoved={(slot) => (slot === "product" ? setProduct(null) : setModel(false))}
                    onEnter={send}
                  />
                </div>
              ) : (
                // Attached photos sit LEFT of the prompt, as the Music Video
                // tab's song slot does (Figma "Agent Input" Photo Attached,
                // product owner 2026-11-02). The row is always rendered so the
                // textarea is not remounted when the first photo arrives.
                <div className="agent-composer__top">
                  {attached[mode] > 0 && (
                    <div className="agent-composer__attach">
                      {Array.from({ length: attached[mode] }, (_, i) => (
                        <PhotoSlot
                          key={i}
                          label={`Photo ${i + 1}`}
                          src={IMG.picked}
                          onPick={() => setPicker("attach")}
                          onClear={() => setAttached({ ...attached, [mode]: attached[mode] - 1 })}
                        />
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={inputRef}
                    key={mode}
                    className="agent-composer__input agent-composer__input--shorts"
                    // An open skill group says what it is for here
                    // (2026-11-18); the field's accessible name stays put.
                    placeholder={
                      SHORTS_SKILL_GROUPS.find((g) => g.id === skillGroup)?.hint ??
                      current.placeholder
                    }
                    aria-label={current.placeholder}
                    value={text[mode]}
                    onChange={(e) => setText({ ...text, [mode]: e.target.value })}
                    rows={3}
                  />
                </div>
              )}

              <div className="agent-composer__bar">
                <div className="agent-composer__tools">
                  <button
                    type="button"
                    className="agent-composer__add"
                    aria-label="Add photo"
                    onClick={openAdd}
                  >
                    <DpIcon name="ic_add" className="agent-composer__add-icon" />
                  </button>
                  {inRecipe && recipe && (
                    // The loaded skill's name with an ✕ that unselects it
                    // (Figma 6096:92356, product owner 2026-11-24): the skill
                    // pill below shows it is on, this says so up here and is
                    // the way to take it back out.
                    <div className="agent-song__style-group">
                      <span className="agent-composer__skill-name">
                        {recipe === "dance" ? "Dance Video" : "UGC Talking Review"}
                      </span>
                      <button
                        type="button"
                        className="agent-song__style-x"
                        aria-label={`Remove ${recipe === "dance" ? "Dance Video" : "UGC Talking Review"}`}
                        onClick={() => {
                          toggleRecipe(recipe);
                          requestAnimationFrame(() =>
                            inputRef.current?.focus({ preventScroll: true }),
                          );
                        }}
                      >
                        <DpIcon name="ic_close" className="agent-song__style-x-icon" />
                      </button>
                    </div>
                  )}
                  {!inRecipe && (
                    <button
                      type="button"
                      className="agent-song__idea"
                      onClick={() =>
                        setText({ ...text, shorts: pickIdea(SHORTS_IDEA_PROMPTS, text.shorts) })
                      }
                    >
                      <DpIcon name="ic_lightbulb" className="agent-song__idea-icon" />
                      Idea
                    </button>
                  )}
                </div>
                <div className="agent-song__cta">
                  {!inRecipe && (
                    <EnhanceButton
                      value={text.shorts}
                      kind="storyboard"
                      onEnhanced={(t) => setText((all) => ({ ...all, shorts: t }))}
                      bem="agent-song"
                    />
                  )}
                  {/* The arrow alone (Figma 5594:201121, "Create" hidden); the
                      word stays its accessible name. */}
                  <button
                    type="button"
                    className={`agent-composer__create agent-composer__create--icon${canSend ? " agent-composer__create--on" : ""}`}
                    disabled={!canSend}
                    onClick={send}
                    aria-label="Create"
                  >
                    <DpIcon name="ic_arrow_right" className="agent-composer__create-icon" />
                    <GuideHint show={hint === "send"} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Collapses, not unmounts, off the AI Shorts tab so the composer's height
            animates (see the card animation above). `inert` keeps the hidden
            pills out of the tab order and the accessibility tree. */}
        <div className="agent-composer__skills-collapse" data-open={skillsOpen} inert={!skillsOpen}>
          <div className="agent-composer__skills-clip">
            <div
              ref={skillsRef}
              className="agent-composer__skills edge-fade"
              aria-label={solo ? "AI Shorts skills" : "Create"}
            >
              {/* Music Video, then Song, before the AI Shorts groups — the same row
                  (product owner, 2026-11-27). A selected one is filled like a
                  selected sub-skill; a second click, or the chip's ✕ in the input
                  bar, puts the composer back on AI Shorts. Like the groups, they
                  step aside while a group is open. */}
              {!solo &&
                PILL_MODES &&
                !skillGroup &&
                MODES.filter((m) => m.id !== "shorts").map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    data-skill={`mode:${m.id}`}
                    className={`agent-composer__skill${mode === m.id ? " agent-composer__skill--on" : ""}`}
                    aria-pressed={mode === m.id}
                    onClick={() => setMode(mode === m.id ? "shorts" : m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              {/* Three group pills (Figma 6096:93403, 2026-11-18). Opening one
                hides the other two and lists its skills after it; the open
                pill wears the MV gradient as a border and an ✕, and a second
                click closes it. Same button either way, so focus stays put. */}
              {SHORTS_SKILL_GROUPS.map((g) =>
                skillGroup && skillGroup !== g.id ? null : (
                  <Fragment key={g.id}>
                    <button
                      type="button"
                      data-skill={`group:${g.id}`}
                      className={`agent-composer__skill${skillGroup === g.id ? " agent-composer__skill--open" : ""}`}
                      aria-expanded={skillGroup === g.id}
                      onClick={() => toggleSkillGroup(g.id)}
                    >
                      {g.label}
                      {skillGroup === g.id && (
                        <DpIcon name="ic_close" className="agent-composer__skill-close" />
                      )}
                      {/* No guide dot on the group pills (product owner, 2026-11-27):
                        the hint appears only on the working skills once a group
                        is open, below. */}
                    </button>
                    {skillGroup === g.id &&
                      g.skills.map((name) => {
                        // The two skills with a recipe; the rest are inert.
                        const kind =
                          name === "UGC Talking Review"
                            ? "ugc"
                            : name === "Dance Video"
                              ? "dance"
                              : null;
                        return (
                          <button
                            key={name}
                            type="button"
                            data-skill={`skill:${name}`}
                            className={`agent-composer__skill${kind && recipe === kind ? " agent-composer__skill--on" : ""}`}
                            aria-pressed={kind ? recipe === kind : undefined}
                            onClick={(e) => {
                              revealSkill(e.currentTarget);
                              if (kind) toggleRecipe(kind);
                            }}
                          >
                            {name}
                            {kind && <GuideHint show={hint === "pill"} />}
                          </button>
                        );
                      })}
                  </Fragment>
                ),
              )}
            </div>
          </div>
        </div>

        <PhotoPicker
          sheet={picker === "product" ? "product" : picker ? "recents" : null}
          hintCell={picker === "product" ? PICK_CELL.ugcProduct : PICK_CELL.model}
          onPick={() => {
            if (picker === "model") setModel(true);
            else if (picker === "character") setCharacter(true);
            else if (picker === "product") setProduct({ type: "photo" });
            else setAttached({ ...attached, [mode]: attached[mode] + 1 });
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
        <LinkSheet
          open={linkOpen}
          initial={product?.type === "url" ? product.url : DEMO_URL}
          onSubmit={(url) => {
            if (url) setProduct({ type: "url", url });
            else if (product?.type === "url") setProduct(null);
            setLinkOpen(false);
          }}
          onClose={() => setLinkOpen(false)}
        />
        <DanceStyleSheet
          open={styleOpen}
          value={danceStyle}
          onPick={(s) => {
            setDanceStyle(s);
            setStyleOpen(false);
          }}
          onClose={() => setStyleOpen(false)}
        />
      </section>
      {/* Music Video styles and AI Shorts skills in one row, whichever tab is
          open; Recent comes after it (product owner, 2026-11-26). */}
      {!solo && <ExploreRow onStyle={applyStyle} onSkill={(flow) => go(`/agent?flow=${flow}`)} />}
      {!solo && <ContinueRow />}
    </>
  );
}

type InspoMode = "mv" | "song";
type Inspiration = HeroCard & { starter: string; genre?: string; mood?: string };

const article = (word: string) => (/^[aeiou]/i.test(word) ? "An" : "A");
/** Lower-case each word unless it is an acronym-like name ("R&B", "EDM"). */
const soften = (words: string) =>
  words
    .split(" ")
    .map((w) => (/[a-z]/.test(w) ? w.toLowerCase() : w))
    .join(" ");

const INSPIRATION: Record<"mv", Inspiration[]> = {
  mv: HERO_ITEMS.map((h) => {
    const mood = soften(h.subtitle.split("|")[0].trim());
    return { ...h, starter: `${article(mood)} ${mood} music video inspired by “${h.title}”.` };
  }),
};

/** A picked photo: a plain AI Shorts attachment, or a recipe's Model /
 *  Product. Same skin as the Music Video tab's picked song (Figma
 *  "Agent Input/Media Slot" Photo = Song, 2026-11-02), so it reuses those
 *  classes rather than copying them. Recipe slots show their name under the
 *  photo; attachments don't. */
function PhotoSlot({
  label,
  src,
  fit,
  showLabel,
  onPick,
  onClear,
}: {
  label: string;
  src: string;
  fit?: boolean;
  showLabel?: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="agent-mv__song">
      <div className="agent-mv__song-slot agent-mv__song-slot--on">
        <button
          type="button"
          className={`agent-mv__song-art${fit ? " agent-recipe__art--fit" : ""}`}
          aria-label={label}
          onClick={onPick}
        >
          <img src={src} alt="" />
        </button>
        <button
          type="button"
          className="agent-mv__song-x"
          aria-label={`Remove ${label}`}
          onClick={onClear}
        >
          <DpIcon name="ic_close" className="agent-mv__song-x-icon" />
        </button>
      </div>
      {showLabel && (
        <span className="agent-mv__song-label" aria-hidden="true">
          {label}
        </span>
      )}
    </div>
  );
}
