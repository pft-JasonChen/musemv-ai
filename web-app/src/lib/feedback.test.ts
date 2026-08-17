import { describe, it, expect } from "vitest";
import {
  acceptAttachments,
  FEEDBACK_MAX_TOTAL_BYTES,
  FEEDBACK_TYPES,
  formatBytes,
  isValidEmail,
  MUSE_PROD_VER_ID,
  questionTypeIdOf,
  totalBytes,
} from "./feedback";

const MB = 1024 * 1024;

describe("feedback — CSB type mapping (spec areas/06 §3.1)", () => {
  it("carries §T3's four ids verbatim", () => {
    expect(questionTypeIdOf("purchase")).toBe(313);
    expect(questionTypeIdOf("account")).toBe(348);
    expect(questionTypeIdOf("feature")).toBe(204);
    expect(questionTypeIdOf("others")).toBe(211);
  });

  // The failure this guards is silent misfiling, not a crash: mapping Community
  // Report onto Others would submit successfully and land in the wrong queue.
  it("leaves Community Report null rather than aliasing it to Others (TBD-PROF-06)", () => {
    expect(questionTypeIdOf("community")).toBeNull();
    expect(questionTypeIdOf("community")).not.toBe(questionTypeIdOf("others"));
  });

  it("offers exactly the five approved types, in order", () => {
    expect(FEEDBACK_TYPES.map((t) => t.key)).toEqual([
      "purchase",
      "account",
      "feature",
      "community",
      "others",
    ]);
  });

  it("has no prodVerId yet, and specifically is not YCO's 504 (TBD-PROF-06)", () => {
    expect(MUSE_PROD_VER_ID).toBeNull();
    expect(MUSE_PROD_VER_ID).not.toBe(504);
  });
});

describe("feedback — attachment budget (PROF-E5 / AC-PROF-15)", () => {
  const file = (size: number, name = "f") => ({ size, name });

  it("is 10 MB", () => {
    expect(FEEDBACK_MAX_TOTAL_BYTES).toBe(10 * MB);
  });

  it("accepts a pick that fits", () => {
    const r = acceptAttachments([file(2 * MB)], [file(3 * MB)]);
    expect(r.refused).toBe(false);
    expect(totalBytes(r.accepted)).toBe(5 * MB);
  });

  it("counts the budget cumulatively, not per file", () => {
    // Two 6 MB files are individually legal and jointly not — the per-file
    // reading of "10 MB total" would wrongly accept this.
    const r = acceptAttachments([file(6 * MB)], [file(6 * MB)]);
    expect(r.refused).toBe(true);
  });

  it("refuses a batch WHOLE — a partial add would read as success", () => {
    const current = [file(9 * MB, "kept")];
    const r = acceptAttachments(current, [file(500 * 1024, "a"), file(2 * MB, "b")]);
    expect(r.refused).toBe(true);
    expect(r.accepted).toEqual(current); // not "a accepted, b dropped"
  });

  it("allows exactly the limit", () => {
    expect(acceptAttachments([], [file(10 * MB)]).refused).toBe(false);
    expect(acceptAttachments([], [file(10 * MB + 1)]).refused).toBe(true);
  });

  it("treats an empty pick as a no-op, not a refusal", () => {
    const current = [file(1 * MB)];
    expect(acceptAttachments(current, [])).toEqual({ accepted: current, refused: false });
  });
});

describe("feedback — email gate (AC-PROF-11)", () => {
  it("accepts a plausible address and tolerates surrounding space", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("  jason_chen@perfectcorp.com  ")).toBe(true);
  });

  it("rejects the shapes that would make Send lie", () => {
    for (const bad of ["", "   ", "nope", "a@b", "a b@c.co", "@b.co", "a@.co"]) {
      expect(isValidEmail(bad), bad).toBe(false);
    }
  });
});

describe("feedback — formatBytes", () => {
  it("switches to MB at a megabyte and never shows 0 KB", () => {
    expect(formatBytes(512)).toBe("1 KB");
    expect(formatBytes(1024 * 900)).toBe("900 KB");
    expect(formatBytes(1.5 * MB)).toBe("1.5 MB");
  });
});
