#!/usr/bin/env node
/**
 * build-token-map.mjs — Gate G2-a: generate docs/token-map.md + docs/token-map.json.
 * docs/redesign-migration-plan-2026-08-01.md §4, §10.0, G2-a.
 *
 * WHY A GENERATOR AND NOT A HAND-WRITTEN TABLE
 *   The designer prototype (DP) is still moving — a final is expected 2026-08-04, and
 *   §12 says every new drop must be re-diffed. A hand-authored map would be stale the
 *   day it lands, and this project's failure mode is exactly that: documents that were
 *   true once. Re-run this instead.
 *
 * USAGE
 *   node scripts/build-token-map.mjs [--dp <path-to-DP-repo>] [--check]
 *
 *   --dp     DP root (default ~/Downloads/YCM-main, per the plan)
 *   --check  exit 2 if the generated map differs from what is on disk — for CI /
 *            the Stop gate, so a token edit without a regenerated map is caught.
 *
 * WHAT IT PROVES / DOESN'T
 *   It matches tokens BY VALUE, which is what §4.1 claims is already true (13 greys +
 *   brand colours identical, "顏色不是重畫,是改名對映"). It cannot tell you which name
 *   is semantically right — that is the review G2-a asks for. Rows are classified so
 *   the review has somewhere to start rather than a wall of 400 variables.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const CHECK = args.includes("--check");
const WA_ROOT = resolve(new URL("..", import.meta.url).pathname);

// DP now lives IN the repo (`designer-prototype/`, vendored 2026-08-04 from
// github.com/marukox1105/YCM — see its PROVENANCE.md). Before that it was expected at
// ~/Downloads/YCM-main, which exists on exactly one laptop; the Stop gate's G2-a leg
// therefore "skipped" everywhere else and looked green while checking nothing. Prefer
// the in-repo copy, keep the old path as a fallback so an existing local checkout
// still works, and let --dp override both.
const IN_REPO_DP = resolve(WA_ROOT, "..", "designer-prototype");
const DP_ROOT = resolve(
  flag("--dp", existsSync(IN_REPO_DP) ? IN_REPO_DP : join(homedir(), "Downloads", "YCM-main")),
);

const WA_TOKENS = join(WA_ROOT, "src", "styles", "tokens.css");
const DP_TOKENS = join(DP_ROOT, "src", "styles", "tokens.css");
const OUT_MD = join(WA_ROOT, "docs", "token-map.md");
const OUT_JSON = join(WA_ROOT, "docs", "token-map.json");

// ── parse ───────────────────────────────────────────────────────────────────
/**
 * `--name: value;` declarations, split by THEME BLOCK.
 *
 * WHY THIS IS NOT A FLAT last-wins MAP
 *   DP declares 13 names twice — once in `:root, [data-theme="light"]` and again in
 *   `[data-theme="dark"]`. A flat last-wins map silently kept whichever block appeared
 *   LAST in the file, which today is dark. That happened to be the right comparison (WA
 *   is dark-only, plan §4.2), but only by accident of declaration order: if the designer
 *   reorders those blocks, every affected row flips to light values and the whole map
 *   appears to change with no real change. That would corrupt the D2 token swap at the
 *   foundation, so the theme is now explicit.
 *
 * WHY THIS IS NOT LINE-BASED (fixed 2026-08-04)
 *   The first version split on "\n" and anchored `^(--name): value;` at the start of each
 *   trimmed line. That silently dropped declarations at BOTH ends of the comparison:
 *     · WA packs three per line — `--fs-body-l: 17px; --fw-body-l: 500; --lh-body-l: 22px;`
 *       — so only the `--fs-*` was seen. **30 of WA's 110 tokens** (every `--fw-*` and
 *       `--lh-*`) were invisible, while `CATEGORY()` below already had `line-height` and
 *       `weight` branches waiting for them. G2-b diffs line-height, so the map that G2-a
 *       gates on was blind to a property the next gate down measures.
 *     · DP writes gradients across several lines, so all **4 `--gradient-*`** were missed
 *       and §1's gradient row printed "(absent)" — reading as "DP dropped it" when DP in
 *       fact defines `--gradient-mv` at 90deg. That is S16, the exact conflict the row exists
 *       to surface, reported as a non-finding.
 *   Both failures were silent: a smaller map looks like a cleaner one. Scan blocks, not lines.
 *
 * Returns { dark, light, themed } — `dark` is the comparison set (WA has no light theme),
 * `themed` names the variables that exist in both so the report can say so out loud.
 */
function parseTokens(file) {
  // Comments are stripped first so a commented-out `--foo: bar;` never counts as a token.
  const src = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const dark = new Map();
  const light = new Map();

  // Walk the source tracking brace depth, collecting each top-level {selector, body}.
  // Neither token file nests blocks, but depth-tracking keeps that from mattering.
  let selector = "";
  let body = "";
  let depth = 0;
  const blocks = [];
  for (const ch of src) {
    if (ch === "{") {
      if (depth === 0) body = "";
      else body += ch;
      depth++;
      continue;
    }
    if (ch === "}") {
      depth--;
      if (depth === 0) { blocks.push({ selector: selector.trim(), body }); selector = ""; }
      else body += ch;
      continue;
    }
    if (depth === 0) selector += ch;
    else body += ch;
  }

  for (const { selector: sel, body: text } of blocks) {
    // `:root` alone is the base (dark in WA, light in DP). DP identifies its light block
    // by the [data-theme="light"] selector, so match on that rather than on file order.
    const isLight = /\[data-theme=["']?light/.test(sel);
    const isDark = /\[data-theme=["']?dark/.test(sel);
    // `[^;]+` spans newlines here — that is what admits DP's multi-line gradients — and
    // the global flag is what admits WA's several-per-line packing.
    for (const m of text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const name = m[1];
      const value = m[2].trim().replace(/\s+/g, " ");
      if (isDark) dark.set(name, value);
      else if (isLight) light.set(name, value);
      else { dark.set(name, value); light.set(name, value); }  // theme-neutral
    }
  }

  const themed = [...dark.keys()].filter((k) => light.has(k) && light.get(k) !== dark.get(k));
  return { dark, light, themed };
}

// ── normalise ───────────────────────────────────────────────────────────────
const hex = (n) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();

/**
 * Canonical form so `#A855F7`, `rgba(168,85,247,1)` and `rgb(168 85 247)` compare
 * equal. Opaque colours collapse to #RRGGBB; translucent ones keep the alpha so a
 * 0.6 scrim never silently matches a solid fill.
 */
function normalise(value) {
  const v = value.trim();
  let m = v.match(/^#([0-9a-f]{3})$/i);
  if (m) return "#" + [...m[1]].map((c) => c + c).join("").toUpperCase();
  m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) return "#" + m[1].toUpperCase();
  m = v.match(/^#([0-9a-f]{8})$/i);
  if (m) {
    const a = parseInt(m[1].slice(6), 16) / 255;
    return a >= 0.999 ? "#" + m[1].slice(0, 6).toUpperCase()
      : `rgba(${parseInt(m[1].slice(0, 2), 16)},${parseInt(m[1].slice(2, 4), 16)},${parseInt(m[1].slice(4, 6), 16)},${+a.toFixed(3)})`;
  }
  m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)$/i);
  if (m) {
    let a = m[4] === undefined ? 1 : (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    const [r, g, b] = [m[1], m[2], m[3]].map(Number);
    return a >= 0.999 ? `#${hex(r)}${hex(g)}${hex(b)}` : `rgba(${r},${g},${b},${+a.toFixed(3)})`;
  }
  if (/^\d+(\.\d+)?px$/.test(v)) return v;
  // rem -> px at the 16px default root. DP expresses radius/spacing in rem and WA in
  // px, so without this every size row reads as a mismatch — which is how the plan's
  // §4.2 came to record "圓角級距整條不同". Several steps are the same number.
  const rem = v.match(/^(-?[\d.]+)rem$/);
  if (rem) return `${+(parseFloat(rem[1]) * 16).toFixed(4)}px`;
  // Collapse whitespace inside functional values so `linear-gradient( 90deg,` and
  // `linear-gradient(90deg,` compare equal — a real angle change still differs.
  if (/^[a-z-]+\(/i.test(v)) {
    return v.toLowerCase().replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\s*,\s*/g, ",").replace(/\s+/g, " ");
  }
  return v.toLowerCase();
}

const CATEGORY = (name, norm) => {
  if (/^#|^rgba\(/.test(norm)) return "colour";
  if (/gradient/.test(norm)) return "gradient";
  if (/^--(r-|radius)/.test(name) || /^\d+px$/.test(norm) && /radius|^--r-/.test(name)) return "radius";
  if (/^--(fs-|font)/.test(name)) return "type";
  if (/^--(lh-|line)/.test(name)) return "line-height";
  if (/^--(fw-)/.test(name)) return "weight";
  if (/^--(sp-|spacing)/.test(name)) return "spacing";
  if (/^--breakpoint/.test(name)) return "breakpoint";
  return "other";
};

// ── build ───────────────────────────────────────────────────────────────────
for (const [label, p] of [["WA", WA_TOKENS], ["DP", DP_TOKENS]]) {
  if (!existsSync(p)) {
    console.error(`build-token-map: ${label} tokens not found at ${p}`);
    if (label === "DP") {
      console.error("  Pass --dp <path> if the designer prototype lives elsewhere.");
      console.error("  The plan's default is ~/Downloads/YCM-main (§ front matter).");
    }
    process.exit(1);
  }
}

const waParsed = parseTokens(WA_TOKENS);
const dpParsed = parseTokens(DP_TOKENS);
// Compare DARK against DARK: WA has no light theme at all (its `:root` is dark), so the
// dark set is the only apples-to-apples comparison. DP's light values are reported
// separately rather than silently discarded.
const wa = waParsed.dark;
const dp = dpParsed.dark;
const dpThemed = dpParsed.themed;

/** value(normalised) -> [dp names] */
const dpByValue = new Map();
for (const [n, v] of dp) {
  const k = normalise(v);
  if (!dpByValue.has(k)) dpByValue.set(k, []);
  dpByValue.get(k).push(n);
}

/** Resolve `var(--x)` one level so semantic aliases compare by their real value. */
function resolved(map, value, depth = 0) {
  const m = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (m && depth < 8 && map.has(m[1])) return resolved(map, map.get(m[1]), depth + 1);
  return value;
}

const rows = [];
for (const [name, raw] of wa) {
  const value = resolved(wa, raw);
  const norm = normalise(value);
  const matches = dpByValue.get(norm) ?? [];
  rows.push({
    wa: name,
    waValue: raw === value ? raw : `${raw} → ${value}`,
    normalised: norm,
    category: CATEGORY(name, norm),
    dp: matches,
    status: matches.length === 0 ? "wa-only" : matches.length === 1 ? "exact" : "ambiguous",
  });
}

const waValues = new Set([...wa.values()].map((v) => normalise(resolved(wa, v))));
const dpOnly = [...dp].filter(([, v]) => !waValues.has(normalise(resolved(dp, v))));

const tally = rows.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});

// ── §4.2 conflicts the plan already called out, checked against the real files ──
const CONFLICTS = [
  { item: "radius scale", wa: "--r-xl", dp: "--radius-md",
    note: "plan §4.2: the whole ladder differs — WA rounded-xl (14px) equals DP --radius-md" },
  { item: "type-name ladder", wa: "--fs-headline", dp: "--font-title-m",
    note: "plan §4.2: names are off by one step — DP title-m (20px) is WA headline" },
  { item: "pink", wa: "--accent-2", dp: "--pf-pink", note: "different colours" },
  { item: "blue", wa: "--blue", dp: "--pf-light-blue", note: "different colours" },
  { item: "gradient angle", wa: "--mv-grad", dp: "--gradient-mv", note: "135deg vs 90deg — confirm the Figma source" },
];
const conflictRows = CONFLICTS.map((c) => ({
  ...c,
  waValue: wa.has(c.wa) ? normalise(resolved(wa, wa.get(c.wa))) : "(absent)",
  dpValue: dp.has(c.dp) ? normalise(resolved(dp, dp.get(c.dp))) : "(absent)",
})).map((c) => ({ ...c, agrees: c.waValue === c.dpValue }));

// ── ladder comparison — the actual R2 risk (radius + type scales) ───────────
// The plan calls these "整條不同" / "名稱錯位一階" and rates R2 🔴. Print both ladders
// side by side, matched by VALUE, so the review argues about a table instead of a claim.
function ladder(prefixWa, prefixDp) {
  const pick = (map, re) => [...map]
    .filter(([n]) => re.test(n))
    .map(([n, v]) => ({ name: n, value: normalise(resolved(map, v)) }))
    .filter((x) => /^[\d.]+px$/.test(x.value))
    .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
  const w = pick(wa, prefixWa);
  const d = pick(dp, prefixDp);
  const values = [...new Set([...w, ...d].map((x) => x.value))]
    .sort((a, b) => parseFloat(a) - parseFloat(b));
  return values.map((v) => ({
    value: v,
    wa: w.filter((x) => x.value === v).map((x) => x.name),
    dp: d.filter((x) => x.value === v).map((x) => x.name),
  }));
}
const radiusLadder = ladder(/^--r-/, /^--radius/);
const typeLadder = ladder(/^--fs-/, /^--font-(?!web-|mobile-)/);

const ladderTable = (title, rowsL, note) => [
  `### ${title}`, "", note, "",
  "| value | WA token | DP token | aligned? |",
  "|---|---|---|---|",
  ...rowsL.map((r) => `| \`${r.value}\` | ${r.wa.map((x) => `\`${x}\``).join(" · ") || "—"} | ${r.dp.map((x) => `\`${x}\``).join(" · ") || "—"} | ${r.wa.length && r.dp.length ? "✅ same value" : r.wa.length ? "WA only" : "DP only"} |`),
  "",
].join("\n");

// ── emit ────────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/\|/g, "\\|");
const stamp = new Date().toISOString().slice(0, 10);

const section = (title, rs) => rs.length === 0 ? "" : [
  `### ${title} (${rs.length})`, "",
  "| WA token | value | DP token | category |",
  "|---|---|---|---|",
  ...rs.map((r) => `| \`${r.wa}\` | \`${esc(r.normalised)}\` | ${r.dp.length ? r.dp.map((d) => `\`${d}\``).join(" · ") : "—"} | ${r.category} |`),
  "",
].join("\n");

const md = `# Token map — WA ⇄ DP

> **GENERATED — do not hand-edit.** \`node scripts/build-token-map.mjs\`
> Sources: \`${WA_TOKENS.replace(WA_ROOT + "/", "")}\` · \`${DP_TOKENS}\`
> Generated ${stamp}. Gate **G2-a** (\`redesign-migration-plan-2026-08-01.md\` §10).

Matching is **by value**, which is what plan §4.1 asserts is already true ("顏色不是重畫,
是改名對映"). It cannot tell you which *name* is semantically correct — that is the
judgement G2-a asks a human for. Re-run after every designer drop (§12 step 1).

**Themes.** WA has no light theme — its \`:root\` is dark. DP ships both, and **${dpThemed.length}
DP variables hold different values in \`[data-theme="light"]\` vs \`[data-theme="dark"]\`. This
map compares DARK to DARK.** DP's light values are not mapped here and are not lost: plan D2
step 4 requires \`<html data-theme="dark">\` on the root layout, without which DP's \`--color-*\`
all resolve to their light values. That single missing attribute would make every migrated
screen wrong in a way that looks like a CSS bug.

**DP is not final** (expected 2026-08-04). Treat \`wa-only\` and \`dp-only\` as "not yet
mapped", not as "missing" — the designer has 11 of our 20 routes still undesigned.

| | count |
|---|---|
| WA tokens | ${wa.size} |
| DP tokens (dark theme) | ${dp.size} |
| DP names that differ between light and dark | ${dpThemed.length} |
| exact value match | ${tally.exact ?? 0} |
| ambiguous (one WA value → several DP names) | ${tally.ambiguous ?? 0} |
| WA-only (no DP token with this value) | ${tally["wa-only"] ?? 0} |
| DP-only | ${dpOnly.length} |

---

## 1. The §4.2 conflicts, verified against the live files

These are the five the plan flagged as the main sources of "視覺走鐘". Values below are
read from the actual token files, so this table stops being a claim and starts being a check.

| item | WA | value | DP | value | agree? | note |
|---|---|---|---|---|---|---|
${conflictRows.map((c) => `| ${c.item} | \`${c.wa}\` | \`${esc(c.waValue)}\` | \`${c.dp}\` | \`${esc(c.dpValue)}\` | ${c.agrees ? "✅ same" : "🔴 differs"} | ${c.note} |`).join("\n")}

## 2. The two ladders R2 is about

> **Measured verdict on R2** (plan rates it 🔴 高, "圓角級距 / 字級命名階梯 ... 完全不同"):
> · **Type scale — ${typeLadder.filter((r) => r.wa.length && r.dp.length).length}/${typeLadder.length} steps carry the SAME value.**
> ${typeLadder.every((r) => r.wa.length && r.dp.length)
    ? "Every step matches. The type half of R2 is a **pure rename**, not a redesign — a `token-aliases.css` mapping closes it with zero visual change."
    : "Some steps differ; see the table."}
> · **Radius — ${radiusLadder.filter((r) => r.wa.length && r.dp.length).length}/${radiusLadder.length} values shared.** WA-only: ${radiusLadder.filter((r) => r.wa.length && !r.dp.length).map((r) => r.value).join(", ") || "none"}. DP-only: ${radiusLadder.filter((r) => !r.wa.length && r.dp.length).map((r) => r.value).join(", ") || "none"}.
> The shared steps are renames; the DP-only larger steps are the real change (a rounder
> visual language — that is **S17**, a design decision, not a mapping bug).
>
> Net: R2's type half looks over-rated, its radius half is real but narrow. Worth
> re-rating before Phase 1 sizing — but confirm against the 2026-08-04 final first.

${ladderTable("Radius", radiusLadder,
  "DP writes radius in `rem`, WA in `px`; both are normalised to px at the 16px root here. " +
  "Rows marked ✅ are the SAME number under a different name — a rename, not a redesign.")}
${ladderTable("Type size", typeLadder,
  "WA `--fs-*` vs DP's semantic `--font-*` (the `--font-web-*` / `--font-mobile-*` " +
  "platform ramps are excluded — they are DP-internal, not the semantic scale).")}

## 3. Mapped by value

${section("Exact match — safe to alias", rows.filter((r) => r.status === "exact"))}
${section("Ambiguous — one WA value maps to several DP names; pick deliberately", rows.filter((r) => r.status === "ambiguous"))}
${section("WA-only — no DP token carries this value yet", rows.filter((r) => r.status === "wa-only"))}

## 4. DP-only — new tokens arriving with the redesign (${dpOnly.length})

<details><summary>expand</summary>

| DP token | value |
|---|---|
${dpOnly.map(([n, v]) => `| \`${n}\` | \`${esc(normalise(resolved(dp, v)))}\` |`).join("\n")}

</details>

---

## How this feeds the gates

- **G2-a** — this file existing and reviewed. The §1 table is the part to review first.
- **G2-b** — \`scripts/computed-style-diff.mjs\` captures computed styles before/after the
  token swap; a correct map means **zero** diff on the 20 existing routes.
- **G2-c** — \`npm run e2e:visual\` pixel-compares six widths against the Phase-0 baseline.
- **D2 (decided)** — DP becomes the token source of truth with \`token-aliases.css\` keeping
  WA's semantic names alive. §2's "exact match" rows are the ones that alias cleanly; the
  §1 conflicts need a decision before Phase 1 starts.
`;

const json = {
  generatedBy: "scripts/build-token-map.mjs",
  generated: stamp,
  sources: { wa: WA_TOKENS, dp: DP_TOKENS },
  counts: { wa: wa.size, dp: dp.size, ...tally, dpOnly: dpOnly.length },
  conflicts: conflictRows,
  rows,
  dpOnly: dpOnly.map(([n, v]) => ({ dp: n, value: normalise(resolved(dp, v)) })),
};

if (CHECK) {
  const stale = [];
  for (const [p, next] of [[OUT_MD, md], [OUT_JSON, JSON.stringify(json, null, 2) + "\n"]]) {
    const cur = existsSync(p) ? readFileSync(p, "utf8") : "";
    // Ignore the date line so a re-run on a later day is not a "diff".
    const strip = (s) => s.replace(/Generated \d{4}-\d{2}-\d{2}/, "").replace(/"generated": "[^"]*"/, "");
    if (strip(cur) !== strip(next)) stale.push(p.replace(WA_ROOT + "/", ""));
  }
  if (stale.length) {
    console.error(`[G2-a FAIL] token map is stale: ${stale.join(", ")}`);
    console.error("  Tokens moved without regenerating. Run: node scripts/build-token-map.mjs");
    process.exit(2);
  }
  console.log("G2-a PASS — token map matches the token files");
  process.exit(0);
}

writeFileSync(OUT_MD, md);
writeFileSync(OUT_JSON, JSON.stringify(json, null, 2) + "\n");
console.log(`token map -> docs/token-map.md + docs/token-map.json`);
console.log(`  WA ${wa.size} · DP ${dp.size} · exact ${tally.exact ?? 0} · ambiguous ${tally.ambiguous ?? 0} · wa-only ${tally["wa-only"] ?? 0} · dp-only ${dpOnly.length}`);
const bad = conflictRows.filter((c) => !c.agrees).length;
console.log(`  §4.2 conflicts still differing: ${bad}/${conflictRows.length}`);
