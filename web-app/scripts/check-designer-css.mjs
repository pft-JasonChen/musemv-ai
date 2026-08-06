#!/usr/bin/env node
/**
 * check-designer-css.mjs — guards the D1 "copy DP's CSS verbatim" strategy.
 *
 * WHY THIS EXISTS
 *   D1 copies the designer's stylesheets across unchanged so the next drop can be a
 *   file-level re-sync instead of a merge. That is the right call, but it means we
 *   also import whatever is wrong with them, and CSS fails SILENTLY: a `var(--x)`
 *   naming a token that does not exist produces no error, no warning, and no build
 *   failure — the declaration is simply dropped and the element inherits something
 *   plausible-looking instead.
 *
 *   Found on the very first file migrated (/history, 2026-08-04): HistoryPage.css
 *   references three tokens that DP's OWN tokens.css never defines —
 *   `--neutral-dark-48` (the scale goes 44 then 54), `--neutral-dark-15` (14 then
 *   24), and `--line-height-body-s` (there is a `--font-body-s`, but the
 *   line-height ramp skips `s`). Three real defects in the first 612 lines. Nobody
 *   would have noticed by looking.
 *
 * WHAT IT CHECKS
 *   1. VERBATIM — every file in src/styles/designer/ is byte-identical to its
 *      source in designer-prototype/. Catches the "I'll just tweak this one value"
 *      edit that the next re-drop would silently revert.
 *   2. RESOLVABLE — every var(--token) referenced by those files is defined in
 *      src/styles/tokens.css or src/styles/token-aliases.css.
 *
 * Unresolved tokens are reported, not fatal by default: they are the DESIGNER's
 * bugs, and blocking our build on them would just mean someone edits the verbatim
 * copy to shut it up — the exact thing check 1 exists to prevent. Report them,
 * send them upstream. Pass --strict to make them fail (for CI once the list is 0).
 *
 * USAGE
 *   node scripts/check-designer-css.mjs [--strict]
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const WA_ROOT = resolve(new URL("..", import.meta.url).pathname);
const DESIGNER_DIR = join(WA_ROOT, "src", "styles", "designer");
const DP_ROOT = resolve(WA_ROOT, "..", "designer-prototype");
const STRICT = process.argv.includes("--strict");

if (!existsSync(DESIGNER_DIR)) {
  console.log("designer-css: no src/styles/designer/ yet — nothing to check");
  process.exit(0);
}

const files = readdirSync(DESIGNER_DIR).filter((f) => f.endsWith(".css"));
if (files.length === 0) {
  console.log("designer-css: pipeline is wired but empty — nothing to check");
  process.exit(0);
}

/** Every --name defined anywhere in our token layer. */
function definedTokens() {
  const names = new Set();
  for (const f of ["tokens.css", "token-aliases.css"]) {
    const p = join(WA_ROOT, "src", "styles", f);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of src.matchAll(/(--[\w-]+)\s*:/g)) names.add(m[1]);
  }
  return names;
}

/** Locate a designer file's source in the drop, wherever the designer filed it. */
function findSource(name) {
  const hits = [];
  (function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === name) hits.push(full);
    }
  })(join(DP_ROOT, "src"));
  return hits;
}

const defined = definedTokens();
let drift = 0;
const unresolved = new Map();

for (const file of files) {
  const localPath = join(DESIGNER_DIR, file);
  const local = readFileSync(localPath, "utf8");

  // 1. verbatim
  const sources = findSource(file);
  if (sources.length === 0) {
    console.error(`[designer-css] ${file}: no source found in designer-prototype/ — is it still in the drop?`);
    drift++;
  } else if (!sources.some((s) => readFileSync(s, "utf8") === local)) {
    console.error(`[designer-css] ${file}: DIFFERS from the drop (${sources[0].replace(DP_ROOT + "/", "")}).`);
    console.error("               Fix it upstream and re-drop — a local edit is lost on the next re-sync.");
    drift++;
  }

  // 2. resolvable
  const body = local.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of body.matchAll(/var\(\s*(--[\w-]+)/g)) {
    if (!defined.has(m[1])) {
      if (!unresolved.has(m[1])) unresolved.set(m[1], new Set());
      unresolved.get(m[1]).add(file);
    }
  }
}

console.log(`designer-css: ${files.length} file(s) checked against the drop`);

if (unresolved.size > 0) {
  console.log(`\n  ${unresolved.size} token(s) referenced but never defined — these are DESIGNER-side bugs.`);
  console.log("  CSS drops the declaration silently, so the element inherits instead. Report upstream:");
  for (const [token, where] of [...unresolved].sort()) {
    console.log(`    ${token}  (used in ${[...where].join(", ")})`);
  }
}

if (drift > 0) {
  console.error(`\n[designer-css] FAIL — ${drift} file(s) are not verbatim copies of the drop.`);
  process.exit(2);
}
if (STRICT && unresolved.size > 0) {
  console.error("\n[designer-css] FAIL (--strict) — unresolved tokens above.");
  process.exit(2);
}
console.log(drift === 0 ? "designer-css PASS — all files verbatim" : "");
