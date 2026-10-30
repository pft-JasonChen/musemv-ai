"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DpIcon } from "@/components/ui/DpIcon";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { GuideHint } from "@/components/agent/GuideHint";
import { LinkSheet } from "@/components/agent/LinkSheet";
import { PhotoPicker } from "@/components/agent/PhotoPicker";
import { useEdgeFade } from "@/components/agent/useEdgeFade";
import {
  AGENT_PROMPT_KEY,
  DEMO_URL,
  IMG,
  PICK_CELL,
  SHORTS_PLACEHOLDER,
  SHORTS_SKILLS,
} from "@/lib/agent/content";
import { SHORTS_IDEA_PROMPTS } from "@/lib/agent/shortsIdeas";
import { TOP_PICKS_SONGS } from "@/lib/mv/community";
import { GENRES, MOODS } from "@/lib/mv/mock";
import { pickIdea } from "@/lib/mv/songIdeas";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { HeroBannerSectionV3, type HeroCard } from "./HeroBannerSectionV3";
import { HERO_ITEMS } from "./heroItems";
import { RecipeEditor } from "./RecipeEditor";
import { MvInput, type MvPick } from "./MvInput";
import { SongInput } from "./SongInput";
import { ShortsTemplates } from "./ShortsTemplates";

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
 * · Video Shorts is the YCA launcher (handoff §1): the 7 skill pills sit under
 *   the input, and `UGC Review` turns the input into its recipe — Model /
 *   Product slots plus "Create a UGC before-and-after video for … featuring …".
 *   Send lights up as soon as the recipe is on, whatever is still missing; the
 *   Agent asks for it in chat. The other six pills are deliberately inert.
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

export function AgentComposer({ variant = "home" }: { variant?: "home" | "shorts" } = {}) {
  const solo = variant === "shorts";
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  const [mode, setMode] = useState<Mode>("shorts");
  const { songCompose, patchSongCompose } = useSongFlow();
  const { compose, patchCompose } = useMvFlow();
  /** What the MV tab's Templates button shows: a template or a hero style. */
  const [mvPick, setMvPick] = useState<MvPick | null>(null);
  const [text, setText] = useState<Record<Mode, string>>({ mv: "", song: "", shorts: "" });
  const [recipe, setRecipe] = useState(false);
  const [product, setProduct] = useState<Product>(null);
  const [model, setModel] = useState(false);
  const [attached, setAttached] = useState<Record<Mode, number>>({ mv: 0, song: 0, shorts: 0 });
  const [picker, setPicker] = useState<"model" | "product" | "attach" | null>(null);
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

  const current = MODES.find((m) => m.id === mode)!;

  // Music Video / Song inspiration (2026-10-28): a card's "Use Style"
  // loads that style into the prompt and brings the composer back into view,
  // instead of leaving Home. Text the user already typed is kept; an empty
  // prompt (or one we filled from an earlier card) gets a starter sentence.
  const applyStyle = (card: HeroCard) => {
    if (mode === "shorts") return;
    const m = mode;
    const item = INSPIRATION[m].find((i) => i.id === card.id);
    if (!item) return;
    const prev = styles[m];
    const keep = (t: string) => t.trim() !== "" && !(prev && t === prev.starter);
    if (m === "song") {
      // The Song tab's text and style live in `songCompose` (SongInput,
      // 2026-10-30): the card sets the Song Style picks it maps to — only
      // values the Song Style sheet offers — plus the starter, in whichever
      // box the current tab shows.
      const field = songCompose.mode === "custom" ? "lyrics" : "describe";
      patchSongCompose({
        genre: item.genre && GENRES.includes(item.genre) ? item.genre : songCompose.genre,
        mood: item.mood && MOODS.includes(item.mood) ? item.mood : songCompose.mood,
        ...(keep(songCompose[field]) ? {} : { [field]: item.starter }),
      });
    } else {
      // The MV tab's prompt is `compose.description` (MvInput, 2026-10-30) —
      // the one `/mv/room` reads; the card shows on its Templates button.
      if (!keep(compose.description)) patchCompose({ description: item.starter });
      setMvPick({ cover: item.thumbnail, name: item.title });
    }
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

  // AI Shorts sends a UGC Review recipe, or — since 2026-10-30 — a free
  // prompt, which opens the Agent on it (`fromPrompt` in flows.ts).
  const canSend = mode === "shorts" ? recipe || text.shorts.trim() !== "" : true;
  const send = () => {
    if (!canSend) return;
    if (mode !== "shorts") return go(current.href!);
    if (recipe) return go(`/agent?flow=ugc&product=${product ? product.type : "none"}`);
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
    setPicker(!inRecipe ? "attach" : !model ? "model" : !product ? "product" : "model");

  // Guide (handoff §3.1, round 0): UGC Review → Product URL → send. The
  // model is left empty on purpose — the Agent asks for it.
  const hint = mode !== "shorts" ? null : !recipe ? "pill" : !product ? "url" : "send";

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
                (product owner, 2026-10-30); CSS shows one or the other. */}
            <span className="agent-composer__heading-full">What would you like to create today?</span>
            <span className="agent-composer__heading-short">What will you create today?</span>
          </h1>
        )}

        {!solo && (
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
            <SongInput inputRef={inputRef} />
          ) : mode === "mv" ? (
            <MvInput inputRef={inputRef} pick={mvPick} onPick={setMvPick} />
          ) : (
            <>
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
                <div className="agent-composer__tools">
                  <button
                    type="button"
                    className="agent-composer__add"
                    aria-label="Add photo"
                    onClick={openAdd}
                  >
                    <DpIcon name="ic_add" className="agent-composer__add-icon" />
                  </button>
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
      {!solo && mode !== "shorts" && (
        // Keyed by tab: the strip reads its catalog once at mount (loop maths).
        <HeroBannerSectionV3
          key={mode}
          items={INSPIRATION[mode]}
          hrefFor={mode === "song" ? (i) => `/song/play?id=${i.id}` : undefined}
          compact
          square={mode === "song"}
          // "Use Style", not "Create": the composer's own Create is the button that
          // actually starts a job; this one only loads the style into the prompt.
          ctaLabel="Use Style"
          onCta={applyStyle}
        />
      )}
      {!solo && mode === "shorts" && (
        <ShortsTemplates onStart={(flow) => go(`/agent?flow=${flow}`)} />
      )}
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
      genre: s.genre,
      mood: s.mood,
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
