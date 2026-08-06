/**
 * postcss-restore-backdrop-filter — put the STANDARD `backdrop-filter` back
 * after the CSS pipeline drops it (TODO.md #4, found by Slice 3b's G7).
 *
 * THE BUG
 *   lightningcss — which `@tailwindcss/postcss` runs internally — treats
 *   `backdrop-filter` and `-webkit-backdrop-filter` as one logical property when
 *   their values are equal, and the LAST declaration wins the prefix set. DP's
 *   stylesheets write them standard-first:
 *
 *       backdrop-filter: blur(8px);
 *       -webkit-backdrop-filter: blur(8px);
 *
 *   so the prefixed one wins and the standard property is dropped from the
 *   bundle — and Chrome ignores `-webkit-backdrop-filter` entirely. Result:
 *   every frosted-glass surface in the migrated UI rendered as plain
 *   transparent in production. 19 declaration pairs across 13 stylesheets.
 *
 * WHY THIS SHAPE OF FIX
 *   Measured across 8 lightningcss configurations (targets from `defaults` to
 *   `safari >= 9`, plus `minify: false`): the loss is NOT target-dependent and
 *   NOT minification-dependent, so there is no config to turn it off.
 *   Declaration order in the source is the only lever — and that lever is not
 *   ours to pull: `src/styles/designer/*.css` are byte-for-byte copies of DP,
 *   gated verbatim (D1 / `designer:check`), and editing them forfeits
 *   file-level re-sync on the next designer drop.
 *
 *   Running before Tailwind is not an option either: Tailwind is what inlines
 *   the `@import`s, so before it runs the designer rules do not exist in the
 *   AST. This plugin therefore runs AFTER Tailwind and repairs the loss.
 *
 *   It is additive. A rule that still has both forms is left alone, so the 7
 *   stylesheets that always worked are untouched, and the day lightningcss
 *   stops collapsing the pair this becomes a silent no-op rather than a
 *   conflicting second opinion.
 *
 * WHY NOTHING DOWNSTREAM RE-COLLAPSES IT
 *   Tailwind's is the only lightningcss pass in the build. Proof: the rules
 *   whose source declares the standard property alone (`CreditBalance`,
 *   `Button`, `HistoryPage`) come out of the build carrying BOTH forms — a
 *   later pass with modern targets would have stripped the prefix off those
 *   again. It doesn't. `e2e/backdrop-filter.spec.ts` asserts the end result on
 *   a real production build so this reasoning cannot rot silently.
 */

const STANDARD = "backdrop-filter";
const PREFIXED = "-webkit-backdrop-filter";

const normalize = (value) => value.replace(/\s+/g, " ").trim().toLowerCase();

/** @type {import('postcss').PluginCreator<void>} */
const plugin = () => ({
  postcssPlugin: "restore-backdrop-filter",
  Rule(rule) {
    /** @type {import('postcss').Declaration[]} */
    const prefixed = [];
    /** @type {Set<string>} */
    const standard = new Set();

    rule.each((node) => {
      if (node.type !== "decl") return;
      const prop = node.prop.toLowerCase();
      if (prop === PREFIXED) prefixed.push(node);
      else if (prop === STANDARD) standard.add(normalize(node.value));
    });

    for (const decl of prefixed) {
      if (standard.has(normalize(decl.value))) continue;
      // After, not before: the standard property must win the cascade.
      decl.after({ prop: STANDARD, value: decl.value, important: decl.important });
    }
  },
});

plugin.postcss = true;

export default plugin;
