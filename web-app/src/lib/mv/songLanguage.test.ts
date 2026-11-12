import { describe, expect, it } from "vitest";
import { isUnsupportedSongLanguage } from "./songLanguage";

describe("unsupported song language errors", () => {
  it("recognizes the reported engine reason and an adapter Error carrying it", () => {
    expect(
      isUnsupportedSongLanguage({
        error: "invalid_parameter",
        errorMessage: "('aiSong: unsupported song language: Czech', 'invalid_parameter')",
      }),
    ).toBe(true);
    expect(isUnsupportedSongLanguage(new Error("aiSong: unsupported song language: Czech"))).toBe(
      true,
    );
  });
  it.each([
    null,
    undefined,
    "invalid_parameter",
    new Error("internal error"),
    { error: "invalid_parameter" },
    { errorMessage: "invalid_parameter" },
  ])("does not mislabel a generic failure: %s", (error) => {
    expect(isUnsupportedSongLanguage(error)).toBe(false);
  });
});
