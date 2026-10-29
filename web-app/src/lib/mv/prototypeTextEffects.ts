/** Prototype-only snapshots. Nothing here extends MuseApi, schemas or domain hooks.
 * Only a successful render commits a snapshot; a staged or failed edit never
 * replaces the previous successful settings. Effect asset keys are not wire IDs.
 */
import { MvSettingsSchema, SongSchema, type Song, type MvSettings } from "@/lib/api/schemas";
import {
  DEFAULT_TEXT_EFFECTS,
  TITLE_EFFECTS,
  SUBTITLE_STYLES,
  type TextEffectSelection,
} from "./textEffects";

export interface PrototypeMvVersion {
  settings: MvSettings;
  effects: TextEffectSelection;
  song?: Song | null;
}
const KEY = "muse_prototype_mv_text_effects_v1";
let activeEffects: TextEffectSelection = { ...DEFAULT_TEXT_EFFECTS };
let pending: PrototypeMvVersion | null = null;
const completed = new Map<string, PrototypeMvVersion>();
const clone = <T>(v: T): T => structuredClone(v);

export function getPrototypeEffects(): TextEffectSelection {
  return clone(activeEffects);
}
export function activatePrototypeEffects(version?: PrototypeMvVersion | null) {
  activeEffects = clone(version?.effects ?? DEFAULT_TEXT_EFFECTS);
  pending = null;
}
export function stagePrototypeEffects(version: PrototypeMvVersion) {
  pending = clone(version);
}
export function takePrototypeEffects(): PrototypeMvVersion | null {
  const next = pending;
  pending = null;
  return next;
}
export function readPrototypeMvVersion(id: string): PrototypeMvVersion | null {
  if (completed.has(id)) return clone(completed.get(id)!);
  try {
    const all: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (!all || typeof all !== "object" || !Object.hasOwn(all, id)) return null;
    const value = (all as Record<string, unknown>)[id];
    if (!value || typeof value !== "object") return null;
    const v = value as {
      settings?: unknown;
      effects?: Partial<TextEffectSelection>;
      song?: unknown;
    };
    const settings = MvSettingsSchema.safeParse(v.settings);
    if (!settings.success || !v.effects) return null;
    const { titleEffect, subtitleStyle } = v.effects;
    if (titleEffect !== null && !TITLE_EFFECTS.some((e) => e.id === titleEffect)) return null;
    if (subtitleStyle !== null && !SUBTITLE_STYLES.some((e) => e.id === subtitleStyle)) return null;
    const song =
      v.song === undefined ? undefined : v.song === null ? null : SongSchema.parse(v.song);
    return clone({
      settings: settings.data,
      effects: {
        titleEffect: titleEffect ?? DEFAULT_TEXT_EFFECTS.titleEffect,
        subtitleStyle: subtitleStyle ?? DEFAULT_TEXT_EFFECTS.subtitleStyle,
      } as TextEffectSelection,
      ...(song !== undefined ? { song } : {}),
    });
  } catch {
    return null;
  }
}
export function commitPrototypeMvVersion(id: string, version: PrototypeMvVersion) {
  completed.set(id, clone(version));
  activeEffects = clone(version.effects);
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    const previous = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    localStorage.setItem(KEY, JSON.stringify({ ...previous, [id]: version }));
  } catch {
    /* The in-session snapshot still works when storage is unavailable. */
  }
}
