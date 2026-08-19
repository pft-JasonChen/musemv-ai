#!/usr/bin/env node
/**
 * computed-style-diff.mjs — Gate G2-b.
 * docs/archive/redesign-migration-plan-2026-08-01.md §10.0 + G2-b.
 *
 * WHAT IT IS FOR
 *   Phase 1 swaps the token layer to DP's while claiming "舊畫面零變化". A pixel diff
 *   (G2-c) tells you *that* something moved; this tells you *which property on which
 *   element* moved, which is the difference between a five-minute fix and an afternoon.
 *   G2-b's pass condition is literally "20 個既有 route 的 computed style diff = 0".
 *
 * USAGE
 *   node scripts/computed-style-diff.mjs capture --out baseline.json
 *   node scripts/computed-style-diff.mjs compare --baseline baseline.json     # exit 2 on any diff
 *   node scripts/computed-style-diff.mjs compare --baseline a.json --against b.json
 *
 *   Options: --url <origin> (default http://localhost:3100, matching playwright.config)
 *            --widths 1440,768   --routes /,/history   --json (machine output)
 *
 * REQUIRES a server already running at --url. The e2e suite starts one via
 * playwright's webServer; standalone, do: `npm run build && npx next start -p 3100`.
 *
 * WHY NOT A PLAYWRIGHT SPEC
 *   Baselines are captured on one commit and compared on another, so this is a
 *   two-invocation tool with a file in between, not a test. Keeping it out of the spec
 *   directory also keeps it out of `npm run e2e` (and therefore out of the Stop gate),
 *   which is right: it is a Phase-1 instrument, run deliberately.
 */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const WA_ROOT = resolve(new URL("..", import.meta.url).pathname);
const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const has = (n) => argv.includes(n);

const ORIGIN = flag("--url", "http://localhost:3100");
const WIDTHS = flag("--widths", "1440,1024,768,375").split(",").map(Number);

/**
 * Properties that a token swap can plausibly move. Deliberately NOT "every computed
 * property": geometry that depends on font metrics or the viewport produces noise that
 * buries the signal, and the whole point of G2-b is a diff you can act on.
 */
const PROPS = [
  "color", "background-color", "border-color", "border-top-color",
  "border-radius", "border-top-left-radius",
  "font-size", "font-weight", "line-height", "letter-spacing", "font-family",
  "background-image", "box-shadow", "opacity",
];

/**
 * WHOLE-DOCUMENT CENSUS, not a selector list.
 *
 * The first version of this script sampled ~12 semantic selectors per route
 * (`body`, `main`, `button`, …). It reported "diff = 0" after `--accent` was changed
 * from #A855F7 to #FF0000 — because on the home page only 17 of 458 elements consume
 * `--accent`, and none of them is the FIRST match of any of those selectors. A gate
 * that passes a brand-colour change is worse than no gate, so: walk every element and
 * record, per property, the distribution of computed values with counts.
 *
 * Why this is the right shape for G2-b: Phase 1 changes ONLY the token layer, with
 * markup untouched, so any movement in the value distribution is exactly the signal.
 * It is also independent of DOM order, so a reordered list is not a false positive.
 */
const ELEMENT_CAP = 4000; // guards against a pathological page; real routes are ~450

/** Same route discovery as e2e/a11y.spec.ts: [locale] is transparent, [id] skipped. */
function discoverRoutes(dir, base = "") {
  const routes = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "[locale]") { routes.push(...discoverRoutes(full, base)); continue; }
      if (entry.startsWith("[")) continue;
      routes.push(...discoverRoutes(full, `${base}/${entry}`));
    } else if (entry === "page.tsx") {
      routes.push(base || "/");
    }
  }
  return routes.sort();
}

async function capture() {
  const routes = flag("--routes", "").trim()
    ? flag("--routes").split(",")
    : discoverRoutes(join(WA_ROOT, "src", "app"));

  // Same escape hatch as playwright.config.ts: when the image's chromium build differs
  // from the one @playwright/test pins, launch() fails with "Executable doesn't exist"
  // and tells you to run `npx playwright install`. Point CHROMIUM_PATH at the binary
  // that IS present instead. Without this, G2-b simply cannot run in a sandboxed env —
  // and a Phase-1 instrument that will not launch is not a gate.
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const out = { origin: ORIGIN, widths: WIDTHS, props: PROPS, elementCap: ELEMENT_CAP, routes: {} };
  let cells = 0;

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    // Signed in: half the routes are behind AuthGuard and would capture an empty shell.
    await page.addInitScript(() => window.localStorage.setItem("muse_auth", "1"));
    for (const route of routes) {
      const res = await page.goto(ORIGIN + route, { waitUntil: "networkidle" }).catch(() => null);
      if (!res || res.status() >= 400) {
        (out.routes[route] ??= {})[width] = { error: `status ${res ? res.status() : "no response"}` };
        continue;
      }
      // Let entry animations (anim-fade/anim-pop, .2-.24s) settle so we read final values.
      await page.waitForTimeout(400);
      const sample = await page.evaluate(
        ([props, cap]) => {
          /** A short, human-usable identity for an element, for locating a diff. */
          const label = (el) => {
            const cls = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 3).join(".");
            const tid = el.getAttribute("data-testid");
            return el.tagName.toLowerCase()
              + (tid ? `[data-testid=${tid}]` : "")
              + (cls ? `.${cls}` : "");
          };
          const census = {};
          const els = document.querySelectorAll("*");
          const n = Math.min(els.length, cap);
          for (let i = 0; i < n; i++) {
            const el = els[i];
            const cs = getComputedStyle(el);
            for (const p of props) {
              const v = cs.getPropertyValue(p).trim();
              if (!v || v === "none" || v === "normal" || v === "auto") continue;
              const bucket = (census[p] ??= {});
              const rec = (bucket[v] ??= { n: 0, eg: [] });
              rec.n++;
              if (rec.eg.length < 3) rec.eg.push(label(el));
            }
          }
          return { elements: els.length, sampled: n, census };
        },
        [PROPS, ELEMENT_CAP],
      );
      (out.routes[route] ??= {})[width] = sample;
      cells += sample.sampled;
    }
    await page.close();
  }
  await browser.close();
  out.capturedCells = cells;
  return out;
}

function diff(a, b) {
  const findings = [];
  for (const route of new Set([...Object.keys(a.routes), ...Object.keys(b.routes)])) {
    const ra = a.routes[route] ?? {}, rb = b.routes[route] ?? {};
    for (const width of new Set([...Object.keys(ra), ...Object.keys(rb)])) {
      const wa = ra[width] ?? {}, wb = rb[width] ?? {};
      if (wa.error || wb.error) {
        if (wa.error !== wb.error) {
          findings.push({ route, width, selector: "(page)", prop: "load",
            baseline: wa.error ?? "ok", current: wb.error ?? "ok" });
        }
        continue;
      }
      const ca = wa.census ?? {}, cb = wb.census ?? {};
      for (const p of new Set([...Object.keys(ca), ...Object.keys(cb)])) {
        const va = ca[p] ?? {}, vb = cb[p] ?? {};
        for (const v of new Set([...Object.keys(va), ...Object.keys(vb)])) {
          const na = va[v]?.n ?? 0, nb = vb[v]?.n ?? 0;
          if (na === nb) continue;
          findings.push({
            route, width: Number(width), prop: p, value: v,
            baselineCount: na, currentCount: nb,
            kind: na === 0 ? "new value" : nb === 0 ? "value gone" : "count changed",
            examples: (vb[v]?.eg ?? va[v]?.eg ?? []).join(", "),
          });
        }
      }
    }
  }
  return findings;
}

function usage(msg) {
  if (msg) console.error(`computed-style-diff: ${msg}\n`);
  console.error(readFileSync(new URL(import.meta.url)).toString().split("*/")[0].replace(/^#!.*\n/, ""));
  process.exit(1);
}

if (cmd === "capture") {
  const outPath = resolve(flag("--out", join(WA_ROOT, "docs", "computed-style-baseline.json")));
  const data = await capture();
  writeFileSync(outPath, JSON.stringify(data, null, 1) + "\n");
  const n = Object.keys(data.routes).length;
  console.log(`captured ${n} routes × ${WIDTHS.length} widths (${data.capturedCells} element samples)`);
  console.log(`  -> ${outPath.replace(WA_ROOT + "/", "")}`);
} else if (cmd === "compare") {
  const basePath = resolve(flag("--baseline", join(WA_ROOT, "docs", "computed-style-baseline.json")));
  if (!existsSync(basePath)) {
    usage(`no baseline at ${basePath}. Capture one first:\n` +
          `  node scripts/computed-style-diff.mjs capture --out ${basePath}`);
  }
  const base = JSON.parse(readFileSync(basePath, "utf8"));
  const againstPath = flag("--against", "");
  const current = againstPath ? JSON.parse(readFileSync(resolve(againstPath), "utf8")) : await capture();
  const findings = diff(base, current);

  if (has("--json")) {
    console.log(JSON.stringify({ baseline: basePath, findings }, null, 1));
  } else if (findings.length === 0) {
    console.log(`G2-b PASS — computed-style diff = 0 across ${Object.keys(base.routes).length} routes × ${base.widths.length} widths`);
  } else {
    const routes = new Set(findings.map((f) => f.route));
    console.error(`[G2-b FAIL] ${findings.length} computed-style difference(s) across ${routes.size} route(s):\n`);
    // Lead with the properties/values that moved most — a token swap shows up as a few
    // values appearing and disappearing in bulk, which is far more legible than a
    // route-by-route dump.
    const byValue = {};
    for (const f of findings) {
      const k = `${f.prop} :: ${f.value}`;
      (byValue[k] ??= { ...f, routes: new Set(), delta: 0 });
      byValue[k].routes.add(f.route);
      byValue[k].delta += f.currentCount - f.baselineCount;
    }
    const ranked = Object.entries(byValue)
      .sort((a, b) => Math.abs(b[1].delta) - Math.abs(a[1].delta));
    for (const [k, f] of ranked.slice(0, 20)) {
      const sign = f.delta > 0 ? `+${f.delta}` : `${f.delta}`;
      console.error(`  ${f.kind.padEnd(13)} ${k}`);
      console.error(`      ${sign} elements over ${f.routes.size} route(s)${f.examples ? `  e.g. ${f.examples}` : ""}`);
    }
    if (ranked.length > 20) console.error(`  … ${ranked.length - 20} more prop/value pairs`);
    console.error("\nPhase 1's acceptance condition is zero. A diff here means the token map is");
    console.error("wrong — fix docs/token-map.md and re-alias, do not accept 'looks fine'.");
  }
  process.exit(findings.length === 0 ? 0 : 2);
} else {
  usage(cmd ? `unknown command "${cmd}"` : null);
}
