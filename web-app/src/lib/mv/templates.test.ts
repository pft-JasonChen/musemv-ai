import { describe, it, expect } from "vitest";
import { TEMPLATES } from "./mock";
import { DESCRIPTION_MAX } from "./types";

const SECTIONS = [
  "Theme:",
  "Character Setting:",
  "Costume Design:",
  "Style:",
  "Scene and Background (no logo, no brand):",
  "Camera Shot:",
  "Ending:",
];

describe("MV templates", () => {
  it("has unique ids and names", () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    expect(new Set(TEMPLATES.map((t) => t.name)).size).toBe(TEMPLATES.length);
  });

  it.each(TEMPLATES.map((t) => [t.name, t.prompt] as const))(
    "%s: has all seven sections, in order, and fits the description box",
    (_name, prompt) => {
      let at = -1;
      for (const heading of SECTIONS) {
        const i = prompt.indexOf(heading);
        expect(i, heading).toBeGreaterThan(at);
        at = i;
      }
      expect(prompt.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    },
  );

  it("never repeats a prompt, so the applied template is unambiguous", () => {
    expect(new Set(TEMPLATES.map((t) => t.prompt)).size).toBe(TEMPLATES.length);
  });
});
