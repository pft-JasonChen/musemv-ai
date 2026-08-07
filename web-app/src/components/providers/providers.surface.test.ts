// Gate G4-b — provider hook surface (C4).
// docs/redesign-migration-plan-2026-08-01.md §9 C4 + §10 G4-b.
//
//   C4 rule: "⚠ 只可新增,不可改名/刪除" — RD patches these hooks to wire the real
//   account, balance, and history, so a renamed or removed key breaks them.
//
// This is a STATIC parse of each `interface *Value { … }` rather than the
// render-a-provider-and-snapshot-Object.keys() approach sketched in §10.0.
// Reasons: the flow providers construct jobs and timers on mount, so rendering
// them needs fake timers plus api mocks — a lot of machinery whose failures
// would look like contract failures. The interface IS the contract RD codes
// against, so reading it directly is both cheaper and more faithful.
//
// The snapshot is an ADD-ONLY gate, checked two ways:
//   1. snapshot diff  — surfaces every change for review
//   2. explicit check — no key present in the committed baseline may disappear
// Adding a key updates the snapshot and passes. Renaming or deleting one fails
// even if someone runs `vitest -u`, because BASELINE below is hand-maintained.
//
// WHEN THIS FAILS: revert, or update docs/CHANGELOG-RD.md in the same commit
// (scripts/check-rd-changelog.sh enforces that) + notify RD, then edit BASELINE.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DIR = join(process.cwd(), "src", "components", "providers");

/** Member names of `interface <name> { … }`, comments and nested generics ignored. */
function interfaceKeys(file: string, ifaceName: string): string[] {
  const src = readFileSync(join(DIR, file), "utf8");
  const start = src.search(new RegExp(`interface\\s+${ifaceName}\\s*{`));
  if (start < 0) throw new Error(`interface ${ifaceName} not found in ${file}`);
  const open = src.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = src
    .slice(open + 1, end)
    .replace(/\/\*[\s\S]*?\*\//g, "") // block + jsdoc comments
    .replace(/\/\/.*$/gm, "");
  // Top-level members only: two-space indent, then `name` then `?`/`:`.
  return [...body.matchAll(/^ {2}([A-Za-z_]\w*)\??\s*:/gm)].map((m) => m[1]).sort();
}

const SURFACES = [
  { hook: "useAuth", file: "AuthProvider.tsx", iface: "AuthValue" },
  { hook: "useCredits", file: "CreditsProvider.tsx", iface: "CreditsValue" },
  { hook: "useHistory", file: "HistoryProvider.tsx", iface: "HistoryValue" },
  { hook: "useMvFlow", file: "MvFlowProvider.tsx", iface: "MvFlowValue" },
  { hook: "useSongFlow", file: "SongFlowProvider.tsx", iface: "SongFlowValue" },
] as const;

/**
 * Hand-maintained baseline of keys RD may depend on. ADD-ONLY.
 * Removing or renaming an entry here is a contract break: it requires an
 * independent PR, a docs/CHANGELOG-RD.md entry, and telling RD (§9 C4).
 */
const BASELINE: Record<string, string[]> = {
  useAuth: [
    "hydrated", "loggedIn", "openSignIn", "profile", "requireLogin", "signOut",
    "status", "subscribe", "subscribed", "subscribedPlan", "updateProfile",
  ],
  useCredits: ["addCredits", "consumeEnhance", "credits", "enhanceCost"],
  useHistory: ["history", "markCompleted", "markFailed", "upsertGenerating"],
  useMvFlow: [
    "compose", "gen", "patchCompose", "resetForNewMv", "resetForRerender",
    "resultUrl", "saveStoryboard", "setCompose", "setResultUrl", "setStoryboard",
    "startRender", "startStoryboard", "storyboard", "storyboardDirty",
  ],
  useSongFlow: [
    "gen", "patchSongCompose", "resetForNewSong", "resetForRecreate",
    "setSongResult", "songCompose", "songResult", "startSong",
  ],
};

describe("C4 — provider hook surfaces [additive only]", () => {
  for (const { hook, file, iface } of SURFACES) {
    describe(hook, () => {
      it("shape is unchanged", () => {
        expect(interfaceKeys(file, iface)).toMatchSnapshot();
      });

      it("no baseline key was renamed or removed", () => {
        const now = new Set(interfaceKeys(file, iface));
        const missing = BASELINE[hook].filter((k) => !now.has(k));
        expect(
          missing,
          `${hook}: RD depends on these keys — removing/renaming them needs an ` +
            `independent PR + docs/CHANGELOG-RD.md + notifying RD (§9 C4)`,
        ).toEqual([]);
      });
    });
  }

  it("the set of contract-bearing providers is unchanged", () => {
    expect(SURFACES.map((s) => s.hook)).toMatchSnapshot();
  });
});
