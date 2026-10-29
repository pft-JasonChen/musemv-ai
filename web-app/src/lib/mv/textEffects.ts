/** Engine POC catalog. Asset stems are local prototype keys, not wire IDs.
 * Current prototype looks use the inspected POC selection; these are not engine-wide defaults.
 * Supplied samples are animated WebP; visible cards play independently of selection.
 */
export const TITLE_EFFECTS = [
  {
    id: "legacy_static",
    label: "置中靜態",
    thumb: "/assets/title_mv/covers/title_effect_legacy_static.png",
    sample: "/assets/title_mv/title_effect_legacy_static.webp",
  },
  {
    id: "author_title",
    label: "作者接標題",
    thumb: "/assets/title_mv/covers/title_effect_author_title.png",
    sample: "/assets/title_mv/title_effect_author_title.webp",
  },
  {
    id: "fadein_fast",
    label: "快速淡入",
    thumb: "/assets/title_mv/covers/title_effect_fadein_fast.png",
    sample: "/assets/title_mv/title_effect_fadein_fast.webp",
  },
  {
    id: "fadein2",
    label: "柔和淡入",
    thumb: "/assets/title_mv/covers/title_effect_fadein2.png",
    sample: "/assets/title_mv/title_effect_fadein2.webp",
  },
  {
    id: "speed_cut_pop",
    label: "快切彈入",
    thumb: "/assets/title_mv/covers/title_effect_speed_cut_pop.png",
    sample: "/assets/title_mv/title_effect_speed_cut_pop.webp",
  },
  {
    id: "static_right",
    label: "右側靜態",
    thumb: "/assets/title_mv/covers/title_effect_static_right.png",
    sample: "/assets/title_mv/title_effect_static_right.webp",
  },
  {
    id: "classic_ktv_title",
    label: "經典KTV標題",
    thumb: "/assets/title_mv/covers/title_effect_classic_ktv_title.png",
    sample: "/assets/title_mv/title_effect_classic_ktv_title.webp",
  },
  {
    id: "split_bottom_serif_color_shift",
    label: "下沉襯線變色",
    thumb: "/assets/title_mv/covers/title_effect_split_bottom_serif_color_shift.png",
    sample: "/assets/title_mv/title_effect_split_bottom_serif_color_shift.webp",
  },
] as const;

export const SUBTITLE_STYLES = [
  {
    id: "legacy_static",
    label: "置中靜態",
    thumb: "/assets/title_mv/covers/subtitle_effect_legacy_static_modular.png",
    sample: "/assets/title_mv/subtitle_effect_legacy_static_modular.webp",
  },
  {
    id: "legacy_rollup",
    label: "向上捲動",
    thumb: "/assets/title_mv/covers/subtitle_effect_legacy_rollup_modular.png",
    sample: "/assets/title_mv/subtitle_effect_legacy_rollup_modular.webp",
  },
  {
    id: "left_fadein",
    label: "靠左淡入",
    thumb: "/assets/title_mv/covers/subtitle_effect_left_fadein_modular.png",
    sample: "/assets/title_mv/subtitle_effect_left_fadein_modular.webp",
  },
  {
    id: "center_fadein_kai",
    label: "楷體淡入",
    thumb: "/assets/title_mv/covers/subtitle_effect_center_fadein_kai_modular.png",
    sample: "/assets/title_mv/subtitle_effect_center_fadein_kai_modular.webp",
  },
  {
    id: "vertical_right_fadein",
    label: "右側直排",
    thumb: "/assets/title_mv/covers/subtitle_effect_vertical_right_fadein_modular.png",
    sample: "/assets/title_mv/subtitle_effect_vertical_right_fadein_modular.webp",
  },
  {
    id: "left_calligraphy_fadein",
    label: "書法淡入",
    thumb: "/assets/title_mv/covers/subtitle_effect_left_calligraphy_fadein_modular.png",
    sample: "/assets/title_mv/subtitle_effect_left_calligraphy_fadein_modular.webp",
  },
  {
    id: "handwritten_alternate",
    label: "手寫交替",
    thumb: "/assets/title_mv/covers/subtitle_effect_handwritten_alternate_modular.png",
    sample: "/assets/title_mv/subtitle_effect_handwritten_alternate_modular.webp",
  },
  {
    id: "gray_spacing_expand",
    label: "灰字展開",
    thumb: "/assets/title_mv/covers/subtitle_effect_gray_spacing_expand_modular.png",
    sample: "/assets/title_mv/subtitle_effect_gray_spacing_expand_modular.webp",
  },
  {
    id: "left_reveal_blur",
    label: "揭示模糊",
    thumb: "/assets/title_mv/covers/subtitle_effect_left_reveal_blur_modular.png",
    sample: "/assets/title_mv/subtitle_effect_left_reveal_blur_modular.webp",
  },
  {
    id: "classic_ktv_vcd_big",
    label: "經典KTV大字",
    thumb: "/assets/title_mv/covers/subtitle_effect_classic_ktv_vcd_big_modular.png",
    sample: "/assets/title_mv/subtitle_effect_classic_ktv_vcd_big_modular.webp",
  },
  {
    id: "dotted_two_line_left_fadein",
    label: "點綴雙行淡入",
    thumb: "/assets/title_mv/covers/subtitle_effect_dotted_two_line_left_fadein_modular.png",
    sample: "/assets/title_mv/subtitle_effect_dotted_two_line_left_fadein_modular.webp",
  },
  {
    id: "left_gradient_wash_fadein",
    label: "漸層暈染淡入",
    thumb: "/assets/title_mv/covers/subtitle_effect_left_gradient_wash_fadein_modular.png",
    sample: "/assets/title_mv/subtitle_effect_left_gradient_wash_fadein_modular.webp",
  },
  {
    id: "scene_label_black_reveal",
    label: "場景黑底標籤",
    thumb: "/assets/title_mv/covers/subtitle_effect_scene_label_black_reveal_modular.png",
    sample: "/assets/title_mv/subtitle_effect_scene_label_black_reveal_modular.webp",
  },
  {
    id: "subtle_fadein",
    label: "簡約淡入",
    thumb: "/assets/title_mv/covers/subtitle_effect_subtle_fadein_modular.png",
    sample: "/assets/title_mv/subtitle_effect_subtle_fadein_modular.webp",
  },
  {
    id: "two_line_left_serif_fadein",
    label: "雙行襯線淡入",
    thumb: "/assets/title_mv/covers/subtitle_effect_two_line_left_serif_fadein_modular.png",
    sample: "/assets/title_mv/subtitle_effect_two_line_left_serif_fadein_modular.webp",
  },
  {
    id: "wide_spaced_subtle_fadein",
    label: "寬距簡約淡入",
    thumb: "/assets/title_mv/covers/subtitle_effect_wide_spaced_subtle_fadein_modular.png",
    sample: "/assets/title_mv/subtitle_effect_wide_spaced_subtle_fadein_modular.webp",
  },
  {
    id: "brush_mask_reveal_left",
    label: "筆刷揭示",
    thumb: "/assets/title_mv/covers/subtitle_effect_brush_mask_reveal_left_modular.png",
    sample: "/assets/title_mv/subtitle_effect_brush_mask_reveal_left_modular.webp",
  },
] as const;

export type TitleEffectId = (typeof TITLE_EFFECTS)[number]["id"];
export type SubtitleStyleId = (typeof SUBTITLE_STYLES)[number]["id"];
export interface TextEffectSelection {
  titleEffect: TitleEffectId;
  subtitleStyle: SubtitleStyleId;
}
/** Seeded current looks for prototype records without a saved snapshot.
 * Observed on the supplied POC; production restores each MV's resolved settings.
 * These values do not claim to be global engine defaults.
 */
export const DEFAULT_TITLE_EFFECT: TitleEffectId = "fadein_fast";
export const DEFAULT_SUBTITLE_STYLE: SubtitleStyleId = "legacy_static";
export const DEFAULT_TEXT_EFFECTS: TextEffectSelection = {
  titleEffect: DEFAULT_TITLE_EFFECT,
  subtitleStyle: DEFAULT_SUBTITLE_STYLE,
};
