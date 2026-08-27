import { beforeEach, describe, expect, it } from "vitest";
import { demoStore, DEMO_FLAGS } from "@/lib/demoStore";

// The demo switchboard. Three of these guard failures that are invisible by
// inspection: an unstable snapshot (hangs the tab), a stored blob from an older
// build (makes a switch uncontrolled), and a dismiss that leaves flags set
// (a fake state stuck on for someone who can no longer see the switch).

beforeEach(() => {
  localStorage.clear();
  // Force the module-level cache to re-read the now-empty storage.
  demoStore.getSnapshot();
});

describe("demoStore — snapshot identity (useSyncExternalStore contract)", () => {
  it("returns the SAME object across calls when nothing changed", () => {
    // If this fails, `useSyncExternalStore` re-renders forever. It is not a perf
    // regression, it is a hung tab — hence a test rather than a comment.
    expect(demoStore.getSnapshot()).toBe(demoStore.getSnapshot());
  });

  it("returns a DIFFERENT object after a write", () => {
    const before = demoStore.getSnapshot();
    demoStore.set({ enabled: true });
    expect(demoStore.getSnapshot()).not.toBe(before);
    expect(demoStore.getSnapshot().enabled).toBe(true);
  });

  it("server snapshot is all-off and stable", () => {
    expect(demoStore.getServerSnapshot()).toBe(demoStore.getServerSnapshot());
    expect(demoStore.getServerSnapshot().enabled).toBe(false);
    expect(Object.values(demoStore.getServerSnapshot().flags).some(Boolean)).toBe(false);
  });
});

describe("demoStore — defaults and hostile stored values", () => {
  it("is disabled by default, so the panel cannot appear without ?demo=1", () => {
    expect(demoStore.getSnapshot().enabled).toBe(false);
  });

  it("every registered flag starts off and is present as a boolean", () => {
    const { flags } = demoStore.getSnapshot();
    for (const f of DEMO_FLAGS) expect(flags[f.key]).toBe(false);
  });

  it("merges a blob written by an OLDER build onto the current defaults", () => {
    // The failure this prevents: a flag added after the blob was written comes
    // back `undefined`, and a switch bound to undefined is uncontrolled.
    localStorage.setItem("muse_demo", JSON.stringify({ enabled: true, flags: { jobFail: true } }));
    const s = demoStore.getSnapshot();
    expect(s.flags.jobFail).toBe(true);
    for (const f of DEMO_FLAGS) expect(typeof s.flags[f.key]).toBe("boolean");
  });

  it("falls back to defaults on unparseable or non-object storage", () => {
    for (const junk of ["not json", "null", '"a string"', "42"]) {
      localStorage.setItem("muse_demo", junk);
      expect(demoStore.getSnapshot().enabled).toBe(false);
    }
  });

  it("rejects an unknown subPlatform rather than passing it through", () => {
    localStorage.setItem("muse_demo", JSON.stringify({ subPlatform: "windows" }));
    expect(demoStore.getSnapshot().subPlatform).toBe("ios");
  });
});

describe("demoStore — dismiss", () => {
  it("clears every flag as well as hiding the panel", () => {
    demoStore.set({ enabled: true });
    demoStore.setFlag("historyEmpty", true);
    demoStore.setFlag("jobFail", true);
    expect(Object.values(demoStore.getSnapshot().flags).some(Boolean)).toBe(true);

    demoStore.dismiss();

    // Both halves matter: hiding without clearing would leave a fake empty
    // History on screen with no visible way to turn it back off.
    expect(demoStore.getSnapshot().enabled).toBe(false);
    expect(Object.values(demoStore.getSnapshot().flags).some(Boolean)).toBe(false);
  });
});

describe("demoStore — setFlag does not disturb its neighbours", () => {
  it("leaves other flags and the selectors alone", () => {
    demoStore.set({ enabled: true, rejectReason: "COPYRIGHT", subPlatform: "android" });
    demoStore.setFlag("apiError", true);
    const s = demoStore.getSnapshot();
    expect(s.flags.apiError).toBe(true);
    expect(s.flags.historyEmpty).toBe(false);
    expect(s.rejectReason).toBe("COPYRIGHT");
    expect(s.subPlatform).toBe("android");
    expect(s.enabled).toBe(true);
  });
});
