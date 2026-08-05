import { fileURLToPath } from "node:url";

// Turbopack resolves plugin ids relative to its own context, not to this file,
// so a bare "./…" string does not resolve. Give it an absolute path.
const restoreBackdropFilter = fileURLToPath(
  new URL("./postcss-restore-backdrop-filter.mjs", import.meta.url),
);

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Must run AFTER Tailwind: Tailwind is what inlines the `@import`s AND what
    // runs the lightningcss pass that drops the standard `backdrop-filter`, so
    // before it there is nothing to see and nothing to repair. See the plugin's
    // header for the full diagnosis (TODO.md #4).
    [restoreBackdropFilter]: {},
  },
};

export default config;
