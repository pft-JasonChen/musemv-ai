"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DpIcon } from "@/components/ui/DpIcon";
import { GuideHint } from "@/components/agent/GuideHint";
import { LinkSheet } from "@/components/agent/LinkSheet";
import { PhotoPicker } from "@/components/agent/PhotoPicker";
import { useEdgeFade } from "@/components/agent/useEdgeFade";
import { DEMO_URL, IMG, PICK_CELL, SHORTS_PLACEHOLDER, SHORTS_SKILLS } from "@/lib/agent/content";
import { TOP_PICKS_SONGS } from "@/lib/mv/community";
import { HeroBannerSectionV3, type HeroCard } from "./HeroBannerSectionV3";
import { HERO_ITEMS } from "./heroItems";
import { RecipeEditor } from "./RecipeEditor";
import { ShortsTemplates } from "./ShortsTemplates";

/**
 * Home's Agent composer (feature/video-agent-home) — replaces the two tool
 * cards with one large prompt input, competitor-style, behind a three-way
 * mode switch: Music Video › Song › Video Shorts.
 *
 * · Music Video / Song are entry points into the EXISTING flows: Create takes
 *   you to `/mv/room` or `/song/create` behind the same `requireLogin` gate the
 *   cards had (AC-EXP-02). The typed text is not carried over yet.
 * · Video Shorts is the YCA launcher (handoff §1): the 7 skill pills sit under
 *   the input, and `UGC Review` turns the input into its recipe — Model /
 *   Product slots plus "Create a UGC before-and-after video for … featuring …".
 *   Send lights up as soon as the recipe is on, whatever is still missing; the
 *   Agent asks for it in chat. The other six pills are deliberately inert.
 *   The recipe is one editable prompt with the chips inline, pollo.ai-style
 *   (2026-10-28): see `RecipeEditor`.
 * · `+` opens the same photo picker as the slots: in the recipe it fills the
 *   first empty slot, elsewhere the photo is attached to the prompt.
 *   The template rails below (Creator / Marketer) start the other two demos.
 * · Under Music Video and Song the old hero filmstrip returns as a smaller
 *   inspiration row (hero MVs / Top Picks songs): its CTA, "Use",
 *   loads the card into the prompt (a Style chip + a starter sentence) rather
 *   than navigating (2026-10-28).
 *
 * Draft styling: the mobile layout follows the Figma chat-based draft
 * (Guideline_YCM 4854:71391) and the desktop one the reference the product
 * owner supplied; both are to be restyled when the final Figma lands.
 */

type Mode = "mv" | "song" | "shorts";
type Product = { type: "photo" } | { type: "url"; url: string } | null;

const MODES: { id: Mode; label: string; icon: string; placeholder: string; href?: string }[] = [
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
  { id: "shorts", label: "AI Shorts", icon: "ic_story_ai", placeholder: SHORTS_PLACEHOLDER },
];

export function AgentComposer() {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  const [mode, setMode] = useState<Mode>("shorts");
  const [text, setText] = useState<Record<Mode, string>>({ mv: "", song: "", shorts: "" });
  const [recipe, setRecipe] = useState(false);
  const [product, setProduct] = useState<Product>(null);
  const [model, setModel] = useState(false);
  const [attached, setAttached] = useState<Record<Mode, number>>({ mv: 0, song: 0, shorts: 0 });
  const [picker, setPicker] = useState<"model" | "product" | "attach" | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  /** Music Video / Song: the inspiration card whose style was loaded into the prompt. */
  const [styles, setStyles] = useState<Record<InspoMode, Inspiration | null>>({ mv: null, song: null });
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modesRef = useEdgeFade<HTMLDivElement>();
  const skillsRef = useEdgeFade<HTMLDivElement>();

  const current = MODES.find((m) => m.id === mode)!;

  // Music Video / Song inspiration (2026-10-28): a card's "Use"
  // loads that style into the prompt and brings the composer back into view,
  // instead of leaving Home. Text the user already typed is kept; an empty
  // prompt (or one we filled from an earlier card) gets a starter sentence.
  const style = mode === "shorts" ? null : styles[mode];
  const applyStyle = (card: HeroCard) => {
    if (mode === "shorts") return;
    const m = mode;
    const item = INSPIRATION[m].find((i) => i.id === card.id);
    if (!item) return;
    const prev = styles[m];
    setText((t) => ({
      ...t,
      [m]: t[m].trim() === "" || (prev && t[m] === prev.starter) ? item.starter : t[m],
    }));
    setStyles((st) => ({ ...st, [m]: item }));
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };
  const inRecipe = mode === "shorts" && recipe;
  const go = (path: string) => requireLogin(() => router.push(localePath(locale, path)));

  const toggleUgc = () => {
    setRecipe((on) => !on);
    setProduct(null);
    setModel(false);
  };

  const canSend = mode === "shorts" ? recipe : true;
  const send = () => {
    if (!canSend) return;
    if (mode !== "shorts") return go(current.href!);
    go(`/agent?flow=ugc&product=${product ? product.type : "none"}`);
  };

  const openAdd = () =>
    setPicker(!inRecipe ? "attach" : !model ? "model" : !product ? "product" : "model");

  // Guide (handoff §3.1, round 0): UGC Review → Product URL → send. The
  // model is left empty on purpose — the Agent asks for it.
  const hint = mode !== "shorts" ? null : !recipe ? "pill" : !product ? "url" : "send";

  // The templates are a SIBLING of the composer, not inside it: the composer
  // keeps its 920px column while the rails run the full width of Home's other
  // sections (product owner, 2026-10-28).
  return (
    <>
      <section className="agent-composer">
        <h1 className="tool-selector-v3__heading agent-composer__heading">
          What would you like to create today?
        </h1>

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

        <div className="agent-composer__card" ref={cardRef}>
          {inRecipe ? (
            <div className="agent-recipe">
              {/* A slot appears only once it holds a photo (2026-10-28): empty
                  placeholders duplicated the inline "+ Model Image" / "+ Product
                  image" chips, which remain the way to add one. */}
              {(model || product) && (
                <div className="agent-recipe__slots">
                  {model && (
                    <Slot
                      label="Model"
                      src={IMG.picked}
                      onPick={() => setPicker("model")}
                      onClear={() => setModel(false)}
                    />
                  )}
                  {product && (
                    <Slot
                      label="Product"
                      src={IMG.product}
                      fit
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
            <>
              {style && mode !== "shorts" && (
                <div className="agent-composer__style">
                  <img src={style.thumbnail} alt="" />
                  <span>
                    Style: <b>{style.title}</b>
                  </span>
                  <button
                    type="button"
                    className="agent-composer__style-x"
                    aria-label={`Remove style ${style.title}`}
                    onClick={() => setStyles((st) => ({ ...st, [mode]: null }))}
                  >
                    <DpIcon name="ic_close" className="agent-recipe__x-icon" />
                  </button>
                </div>
              )}
              {attached[mode] > 0 && (
                <div className="agent-composer__attach">
                  {Array.from({ length: attached[mode] }, (_, i) => (
                    <Slot
                      key={i}
                      label={`Photo ${i + 1}`}
                      src={IMG.picked}
                      onPick={() => setPicker("attach")}
                      onClear={() => setAttached({ ...attached, [mode]: attached[mode] - 1 })}
                      hideLabel
                    />
                  ))}
                </div>
              )}
              <textarea
                ref={inputRef}
                key={mode}
                className="agent-composer__input"
                placeholder={current.placeholder}
                aria-label={current.placeholder}
                value={text[mode]}
                onChange={(e) => setText({ ...text, [mode]: e.target.value })}
                rows={3}
              />
            </>
          )}

          <div className="agent-composer__bar">
            <button
              type="button"
              className="agent-composer__add"
              aria-label="Add photo"
              onClick={openAdd}
            >
              <DpIcon name="ic_add" className="agent-composer__add-icon" />
            </button>
            <button
              type="button"
              className={`agent-composer__create${canSend ? " agent-composer__create--on" : ""}`}
              disabled={!canSend}
              onClick={send}
            >
              Create
              <DpIcon name="ic_arrow_right" className="agent-composer__create-icon" />
              <GuideHint show={hint === "send"} />
            </button>
          </div>
        </div>

        {mode === "shorts" && (
          <div
            ref={skillsRef}
            className="agent-composer__skills edge-fade"
            aria-label="AI Shorts skills"
          >
            {SHORTS_SKILLS.map((name) => {
              const live = name === "UGC Review";
              return (
                <button
                  key={name}
                  type="button"
                  className={`agent-composer__skill${live && recipe ? " agent-composer__skill--on" : ""}`}
                  aria-pressed={live ? recipe : undefined}
                  onClick={live ? toggleUgc : undefined}
                >
                  {name}
                  {live && <GuideHint show={hint === "pill"} />}
                </button>
              );
            })}
          </div>
        )}

        <PhotoPicker
          sheet={picker === "product" ? "product" : picker ? "recents" : null}
          hintCell={picker === "product" ? PICK_CELL.ugcProduct : PICK_CELL.model}
          onPick={() => {
            if (picker === "model") setModel(true);
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
      </section>
      {mode !== "shorts" && (
        // Keyed by tab: the strip reads its catalog once at mount (loop maths).
        <HeroBannerSectionV3
          key={mode}
          items={INSPIRATION[mode]}
          hrefFor={mode === "song" ? (i) => `/song/play?id=${i.id}` : undefined}
          compact
          square={mode === "song"}
          // "Use", not "Create": the composer's own Create is the button that
          // actually starts a job; this one only loads the style into the prompt.
          ctaLabel="Use"
          onCta={applyStyle}
        />
      )}
      {mode === "shorts" && <ShortsTemplates onStart={(flow) => go(`/agent?flow=${flow}`)} />}
    </>
  );
}

type InspoMode = "mv" | "song";
type Inspiration = HeroCard & { starter: string };

const article = (word: string) => (/^[aeiou]/i.test(word) ? "An" : "A");
/** Lower-case each word unless it is an acronym-like name ("R&B", "EDM"). */
const soften = (words: string) =>
  words
    .split(" ")
    .map((w) => (/[a-z]/.test(w) ? w.toLowerCase() : w))
    .join(" ");

/** The Song strip is titled by GENRE so each card reads as a style at a
 *  glance (product owner, 2026-10-28). The catalog's own `genre` is too coarse
 *  for that — two songs are "Electronic · Energetic", two "Hip-Hop · Calm" —
 *  so each Top Pick gets a specific genre name here; the song becomes the
 *  subtitle. Keyed by title; an unlisted song falls back to mood + genre. */
const SONG_GENRE: Record<string, string> = {
  "Neon Static": "Dark Electronic",
  "Pop Anthem": "Upbeat Pop",
  "Chill R&B": "Chill R&B",
  Electronic: "EDM",
  "Acoustic Folk": "Acoustic Folk",
  "Synth Wave": "Synthwave",
  "Indie Vibes": "Indie Rock",
  "Jazz Nights": "Smooth Jazz",
  "Chill Beats": "Chill Hip-Hop",
  "Retro Funk": "Retro Funk",
  "Dream Pop": "Dream Pop",
  "Lo-Fi Study": "Lo-Fi",
  "Summer Breeze": "Country Pop",
};

/** What each tab's inspiration strip shows, plus the starter sentence its
 *  "Use" writes — e.g. "An energetic music video inspired by
 *  “Splash Zone”." / "A dark electronic song inspired by “Neon Static”." */
const INSPIRATION: Record<InspoMode, Inspiration[]> = {
  mv: HERO_ITEMS.map((h) => {
    const mood = soften(h.subtitle.split("|")[0].trim());
    return { ...h, starter: `${article(mood)} ${mood} music video inspired by “${h.title}”.` };
  }),
  song: TOP_PICKS_SONGS.map((s) => {
    const genre = SONG_GENRE[s.title] ?? `${s.mood} ${s.genre}`;
    return {
      id: s.id,
      title: genre,
      subtitle: `${s.mood} | “${s.title}”`,
      thumbnail: s.cover,
      starter: `${article(genre)} ${soften(genre)} song inspired by “${s.title}”.`,
    };
  }),
};

function Slot({
  label,
  src,
  fit,
  hideLabel,
  onPick,
  onClear,
}: {
  label: string;
  src: string | null;
  fit?: boolean;
  hideLabel?: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="agent-recipe__slot">
      <button
        type="button"
        className={`agent-recipe__ph${fit ? " agent-recipe__ph--fit" : ""}`}
        aria-label={label}
        onClick={onPick}
      >
        {src ? <img src={src} alt="" /> : <DpIcon name="ic_add" className="agent-recipe__plus" />}
      </button>
      {!hideLabel && <span className="agent-recipe__lb">{label}</span>}
      {src && (
        <button
          type="button"
          className="agent-recipe__x"
          aria-label={`Remove ${label}`}
          onClick={onClear}
        >
          <DpIcon name="ic_close" className="agent-recipe__x-icon" />
        </button>
      )}
    </div>
  );
}
