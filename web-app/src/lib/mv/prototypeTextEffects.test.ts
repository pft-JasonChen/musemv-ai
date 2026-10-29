import { describe, expect, it } from "vitest";
import { DEFAULT_COMPOSE } from "./types";
import {
  stagePrototypeEffects,
  takePrototypeEffects,
  commitPrototypeMvVersion,
  readPrototypeMvVersion,
  activatePrototypeEffects,
  getPrototypeEffects,
} from "./prototypeTextEffects";

const version = {
  settings: DEFAULT_COMPOSE.settings,
  effects: { titleEffect: "author_title", subtitleStyle: "brush_mask_reveal_left" },
} as const;
describe("prototype effects snapshot", () => {
  it("keeps drafts off the successful version until commit and consumes staging once", () => {
    stagePrototypeEffects(version);
    expect(readPrototypeMvVersion("pending-only")).toBeNull();
    expect(takePrototypeEffects()).toEqual(version);
    expect(takePrototypeEffects()).toBeNull();
  });
  it("restores a completed version without overwriting it with a later uncommitted draft", () => {
    commitPrototypeMvVersion("successful-merge", version);
    stagePrototypeEffects({
      ...version,
      effects: { titleEffect: "fadein_fast", subtitleStyle: "legacy_static" },
    });
    takePrototypeEffects(); // A failed render never calls commit.
    expect(readPrototypeMvVersion("successful-merge")).toEqual(version);
    activatePrototypeEffects(readPrototypeMvVersion("successful-merge"));
    expect(getPrototypeEffects()).toEqual(version.effects);
    activatePrototypeEffects();
    expect(getPrototypeEffects()).toEqual({
      titleEffect: "fadein_fast",
      subtitleStyle: "legacy_static",
    });
  });
  it("validates persisted settings and preserves a timed source song across a fresh read", () => {
    const stored = {
      ...version,
      song: {
        id: "timed-source",
        title: "Song",
        source: "import",
        durationSec: 60,
        art: "",
        lyrics: "[00:05]Actual timed lyric",
      },
    };
    localStorage.setItem(
      "muse_prototype_mv_text_effects_v1",
      JSON.stringify({
        "persisted-not-in-memory": stored,
        "old-unset": { ...stored, effects: { titleEffect: null, subtitleStyle: null } },
        "invalid-effect": {
          ...stored,
          effects: { titleEffect: "unknown-engine-key", subtitleStyle: "legacy_static" },
        },
      }),
    );
    expect(readPrototypeMvVersion("persisted-not-in-memory")).toEqual(stored);
    expect(readPrototypeMvVersion("invalid-effect")).toBeNull();
    expect(readPrototypeMvVersion("old-unset")?.effects).toEqual({
      titleEffect: "fadein_fast",
      subtitleStyle: "legacy_static",
    });
  });
});
