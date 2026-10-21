/**
 * Title effects and subtitle styles for the MV editor's "Edit Title & Subtitle"
 * popup (Figma 5356:174566). The thumbnails are the product's own artwork; the
 * live preview re-draws each look in CSS (`designer-overrides.css`, `.fx-*`),
 * approximated from those thumbnails — there is no spec for the exact type.
 *
 * The chosen ids are held in `MvEditor` state only. They are deliberately NOT in
 * `MvSettings` (RD contract C2): product owner, 2026-10-23, "don't touch the
 * contract yet". Moving them there later is a schema change with its own PR.
 */
export const TITLE_EFFECTS = [
  { id: "cinematic", label: "Cinematic", thumb: "/assets/images/title-effect/title_effect_01_cinematic.png" },
  { id: "bold", label: "Bold", thumb: "/assets/images/title-effect/title_effect_02_bold.png" },
  { id: "neon", label: "Neon", thumb: "/assets/images/title-effect/title_effect_03_neon.png" },
  { id: "script", label: "Script", thumb: "/assets/images/title-effect/title_effect_04_script.png" },
  { id: "editorial", label: "Editorial", thumb: "/assets/images/title-effect/title_effect_05_editorial.png" },
  { id: "glitch", label: "Glitch", thumb: "/assets/images/title-effect/title_effect_06_glitch.png" },
] as const;

export const SUBTITLE_STYLES = [
  { id: "classic", label: "Classic", thumb: "/assets/images/subtitle-style/subtitle_style_01_classic.png" },
  { id: "box", label: "Box", thumb: "/assets/images/subtitle-style/subtitle_style_02_box.png" },
  { id: "outline", label: "Outline", thumb: "/assets/images/subtitle-style/subtitle_style_03_outline.png" },
  { id: "karaoke", label: "Karaoke", thumb: "/assets/images/subtitle-style/subtitle_style_04_karaoke.png" },
  { id: "typewriter", label: "Typewriter", thumb: "/assets/images/subtitle-style/subtitle_style_05_typewriter.png" },
  { id: "twoline", label: "Two line", thumb: "/assets/images/subtitle-style/subtitle_style_06_twoline.png" },
  { id: "italic", label: "Italic", thumb: "/assets/images/subtitle-style/subtitle_style_07_italic.png" },
  { id: "highlight", label: "Highlight", thumb: "/assets/images/subtitle-style/subtitle_style_08_highlight.png" },
  { id: "glow", label: "Glow", thumb: "/assets/images/subtitle-style/subtitle_style_09_glow.png" },
  { id: "spaced", label: "Spaced", thumb: "/assets/images/subtitle-style/subtitle_style_10_spaced.png" },
] as const;

export type TitleEffectId = (typeof TITLE_EFFECTS)[number]["id"];
export type SubtitleStyleId = (typeof SUBTITLE_STYLES)[number]["id"];

export const DEFAULT_TITLE_EFFECT: TitleEffectId = "cinematic";
export const DEFAULT_SUBTITLE_STYLE: SubtitleStyleId = "classic";

/** Sample line for the preview — Figma's own ("Edit Title & Subtitle"). */
export const SAMPLE_SUBTITLE = "Under the silver moonlight, we dance";
