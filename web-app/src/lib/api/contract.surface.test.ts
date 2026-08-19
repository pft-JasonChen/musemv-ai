// Gate G4 — RD contract surface snapshot.
// docs/archive/redesign-migration-plan-2026-08-01.md §9 (C1–C8) + §10 G4.
//
// WHY THIS FILE EXISTS
//   RD depends on interfaces, not screens. The designer-UI migration must be a
//   zero-diff change to C1–C8. §10 states that as a rule agents "must not"
//   break — but a rule that only lives in a document is a convention, and this
//   project's own HARNESS_AUDIT already showed convention-only gates decay
//   (H5, "convention only ⚠", unfixed for six weeks). So the rule lives here,
//   as a snapshot test, and rides `npm run test:run` — which is already inside
//   G1-a and .claude/hooks/stop-verify.sh. Breaking a contract now fails Stop.
//
// WHAT IT COVERS
//   C1 MuseApi method set          C6 locale model
//   C2 Zod wire schemas            C7 route map
//   C3 the swap point              C8 domain constants
//   C5 auth storage key            (C4 = provider hooks, see providers.surface.test.ts)
//
// DELIBERATE DEVIATIONS FROM §10.0
//   • C7 is checked here, not in `e2e/route-map.spec.ts`. Routes are derivable
//     statically from src/app/**/page.tsx — no browser needed, so it runs in
//     the fast gate instead of the slow one. `discoverRoutes()` in
//     e2e/a11y.spec.ts stays as-is for a11y sweeps.
//   • Type-level surfaces (C1) are parsed from source text rather than reflected
//     at runtime, because TS types are erased. The runtime half is still
//     checked: every declared method must exist on the exported `api`.
//
// WHEN A SNAPSHOT FAILS
//   That is the gate working. Either revert, or: intend the change → update
//   docs/CHANGELOG-RD.md in the same commit (scripts/check-rd-changelog.sh
//   enforces this), notify RD, then `npx vitest run -u`.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as z from "zod";

import { api } from "./index";
import * as schemas from "./schemas";
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALES,
  localePath,
} from "@/lib/i18n/config";
import {
  COST_COVER,
  COST_FROM_SCRIPT,
  COST_MERGE,
  COST_RECREATE,
  COST_SONG_INSTRUMENTAL,
  COST_SONG_VOCAL,
  COST_UPLOAD_SONG,
  createMvCost,
  DEFAULT_SETTINGS,
  DESCRIPTION_MAX,
  generateMvCost,
  isComposeReady,
  recreateShotCost,
  scriptCost,
} from "@/lib/mv/types";

const SRC = join(process.cwd(), "src");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

// ── C1 — MuseApi method set ────────────────────────────────────────────────
describe("C1 — MuseApi contract (src/lib/api/contract.ts) [FROZEN]", () => {
  /** Method names declared inside `export interface MuseApi { … }`. */
  const declaredMethods = (): string[] => {
    const src = read("lib/api/contract.ts");
    const body = src.slice(src.indexOf("export interface MuseApi"));
    const open = body.indexOf("{");
    let depth = 0;
    let end = open;
    for (let i = open; i < body.length; i++) {
      if (body[i] === "{") depth++;
      else if (body[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const inner = body.slice(open + 1, end);
    return [...inner.matchAll(/^\s{2}([A-Za-z_]\w*)\s*\(/gm)].map((m) => m[1]).sort();
  };

  it("method names are unchanged", () => {
    expect(declaredMethods()).toMatchSnapshot();
  });

  it("the exported api implements every declared method (impl has not drifted)", () => {
    const impl = api as unknown as Record<string, unknown>;
    for (const name of declaredMethods()) {
      expect(typeof impl[name], `api.${name} missing`).toBe("function");
    }
  });

  it("EnhanceKind union is unchanged", () => {
    const m = read("lib/api/contract.ts").match(/export type EnhanceKind\s*=\s*([^;]+);/);
    expect(m?.[1].replace(/\s+/g, " ").trim()).toMatchSnapshot();
  });
});

// ── C2 — Zod wire schemas ─────────────────────────────────────────────────
describe("C2 — wire schemas (src/lib/api/schemas.ts) [FROZEN]", () => {
  /** The slice of JSON Schema this outline reads. */
  type JsonSchemaNode = {
    type?: string;
    enum?: (string | number | boolean | null)[];
    required?: string[];
    properties?: Record<string, JsonSchemaNode>;
    items?: JsonSchemaNode;
    anyOf?: JsonSchemaNode[];
    $ref?: string;
  };

  /** Compact, diff-readable shape: name, type, optionality — not full JSON Schema. */
  const outline = (node: JsonSchemaNode | undefined, depth = 0): string[] => {
    if (!node?.properties) return [];
    const pad = "  ".repeat(depth);
    const required = node.required ?? [];
    const lines: string[] = [];
    for (const key of Object.keys(node.properties).sort()) {
      const p = node.properties[key];
      const kind = p.enum
        ? `enum[${p.enum.join("|")}]`
        : (p.type ?? (p.anyOf ? "anyOf" : p.$ref ? "ref" : "unknown"));
      lines.push(`${pad}${key}: ${kind}${required.includes(key) ? "" : "?"}`);
      lines.push(...outline(p.type === "array" ? p.items : p, depth + 1));
    }
    return lines;
  };

  const zodSchemas = Object.entries(schemas)
    .filter(([name, v]) => name.endsWith("Schema") && v instanceof z.ZodType)
    .sort(([a], [b]) => a.localeCompare(b));

  it("the exported schema list is unchanged", () => {
    expect(zodSchemas.map(([n]) => n)).toMatchSnapshot();
  });

  for (const [name, schema] of zodSchemas) {
    it(`${name} shape is unchanged`, () => {
      const json = z.toJSONSchema(schema as z.ZodType, {
        io: "input",
        unrepresentable: "any",
      });
      const body = outline(json as JsonSchemaNode);
      expect(body.length ? body.join("\n") : JSON.stringify(json)).toMatchSnapshot();
    });
  }
});

// ── C3 — the swap point ───────────────────────────────────────────────────
describe("C3 — swap point (src/lib/api/index.ts) [FROZEN]", () => {
  it("still exports `api` typed as MuseApi, constructed in exactly one place", () => {
    const src = read("lib/api/index.ts");
    expect(src).toMatch(/export const api:\s*MuseApi\s*=/);
    expect(src.match(/new\s+\w*MuseApi\(/g)?.length ?? 0).toBe(1);
  });

  it("no module outside src/lib/api imports MockMuseApi (mirrors G1-b)", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) {
          if (p !== join(SRC, "lib", "api")) walk(p);
        } else if (/\.tsx?$/.test(e) && readFileSync(p, "utf8").includes("MockMuseApi")) {
          offenders.push(p.slice(SRC.length + 1));
        }
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });
});

// ── C5 — auth storage key ─────────────────────────────────────────────────
describe("C5 — auth storage (src/lib/authStore.ts)", () => {
  it('key is still localStorage["muse_auth"] and session storage is not used', () => {
    const src = read("lib/authStore.ts");
    expect(src).toContain('const LS_KEY = "muse_auth"');
    // Written as a character class on purpose: a literal spelling of the banned
    // identifier in this file would itself trip the G1-b grep in
    // .claude/hooks/guard-greps.sh. Keeping the grep exception-free is worth the
    // one-character indirection — an exclusion for *.test.ts would be a hole.
    expect(src).not.toMatch(/session[S]torage/);
  });
});

// ── C6 — locale model ─────────────────────────────────────────────────────
describe("C6 — locale model (src/lib/i18n/config.ts)", () => {
  it("LOCALES, default, and HTML_LANG are unchanged", () => {
    expect({
      LOCALES: [...LOCALES],
      DEFAULT_LOCALE,
      HTML_LANG,
    }).toMatchSnapshot();
  });

  it("localePath keeps English unprefixed and prefixes the rest", () => {
    expect(localePath("enu", "/profile")).toBe("/profile");
    expect(localePath("jpn", "/profile")).toBe("/jpn/profile");
    expect(localePath("enu", "/")).toBe("/");
    expect(localePath("jpn", "/")).toBe("/jpn");
  });
});

// ── C7 — route map ────────────────────────────────────────────────────────
describe("C7 — route map (src/app/**/page.tsx)", () => {
  it("the URL shapes RD deep-links against are unchanged", () => {
    const routes: string[] = [];
    const walk = (dir: string, rel: string) => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p, `${rel}/${e}`);
        else if (e === "page.tsx") routes.push(rel === "" ? "/" : rel);
      }
    };
    walk(join(SRC, "app"), "");
    expect(routes.sort()).toMatchSnapshot();
  });
});

// ── C8 — domain constants ─────────────────────────────────────────────────
describe("C8 — domain constants (src/lib/mv/types.ts) [additive only]", () => {
  it("credit costs are unchanged (billing depends on these)", () => {
    // COST_REGEN / COST_COVER joined this file on 2026-08-12. They had lived as
    // module-local consts in `components/mv/MvEditor.tsx`, i.e. OUTSIDE C8 — two
    // of the six credit costs could be changed without this snapshot or the
    // G4-g changelog gate noticing. Freezing them here is the point of the move.
    //
    // Same day, TBD-CC-05 replaced the two SONG placeholders: `COST_SONG` (10)
    // and `COST_SONG_RECREATE` (50) became `COST_SONG_VOCAL` (6) /
    // `COST_SONG_INSTRUMENTAL` (12), because spec 11 §3.1 bills on the
    // Instrumental toggle and a Recreate is just another generation. That is a
    // C8 REMOVAL as well as an addition — logged in `docs/CHANGELOG-RD.md`.
    //
    // 2026-08-19 — `COST_STORYBOARD` / `COST_RENDER` / `COST_REGEN` are GONE.
    // They were flat placeholders for rules that spec 11 prices per second and
    // per tier, so no single number could be right. A second C8 removal, again
    // logged in `docs/CHANGELOG-RD.md`. What is frozen now is the per-song rates
    // and the two flat costs.
    expect({
      COST_UPLOAD_SONG,
      COST_FROM_SCRIPT,
      COST_RECREATE,
      COST_SONG_VOCAL,
      COST_SONG_INSTRUMENTAL,
      COST_MERGE,
      COST_COVER,
      DESCRIPTION_MAX,
    }).toMatchSnapshot();
  });

  it("the duration-priced rules match spec 11's worked examples", () => {
    // Every number below is quoted verbatim from `specs/areas/11-credit-consumption.md`,
    // so a rate table edit that drifts from the spec fails here rather than in
    // a user's balance.
    expect(createMvCost("singing", "1080p", 30)).toBe(225); // §3.2 `45 + 6×30`
    expect(generateMvCost("storytelling", "720p", 30)).toBe(95); // §3.4 `35 + 2×30`
    expect(recreateShotCost("story", "1080p", 5)).toBe(28); // §3.5 `8 + 4×5`
    expect([scriptCost(30), scriptCost(90), scriptCost(200)]).toEqual([12, 15, 18]); // §3.3 + §6.1
    // §3.4's note: the storyboard route costs the script plus the render. Its
    // worked example said 110, which was the pre-§6.1 arithmetic — a 30s song
    // now falls in the `[1,40] = 12` tier, not `15`. Spec corrected 2026-08-19.
    expect(scriptCost(30) + generateMvCost("storytelling", "720p", 30)).toBe(107);
  });

  it("DEFAULT_SETTINGS is unchanged", () => {
    expect(DEFAULT_SETTINGS).toMatchSnapshot();
  });

  it("isComposeReady still gates on song + description", () => {
    expect(isComposeReady({ description: "", song: null } as never)).toBe(false);
  });
});
