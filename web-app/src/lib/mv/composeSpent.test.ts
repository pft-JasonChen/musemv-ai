import { beforeEach, describe, expect, it } from "vitest";
import { consumeSpentCompose, markComposeSpent } from "./composeSpent";
import { DEFAULT_COMPOSE } from "./types";

describe("composeSpent", () => {
  beforeEach(() => markComposeSpent(null));

  it("empties the form the result page was showing, once", () => {
    const form = { ...DEFAULT_COMPOSE, description: "a finished MV" };
    markComposeSpent(form);
    expect(consumeSpentCompose(form)).toBe(true);
    expect(consumeSpentCompose(form)).toBe(false);
  });

  it("leaves a form something else has changed since (a hand-off into the room)", () => {
    const form = { ...DEFAULT_COMPOSE, description: "a finished MV" };
    markComposeSpent(form);
    const handedOff = { ...form, description: "from Home" };
    expect(consumeSpentCompose(handedOff)).toBe(false);
  });

  it("keeps the form when the mark is cleared (Recreate)", () => {
    const form = { ...DEFAULT_COMPOSE, description: "a finished MV" };
    markComposeSpent(form);
    markComposeSpent(null);
    expect(consumeSpentCompose(form)).toBe(false);
  });

  it("does nothing when nothing was marked", () => {
    expect(consumeSpentCompose(DEFAULT_COMPOSE)).toBe(false);
  });
});
