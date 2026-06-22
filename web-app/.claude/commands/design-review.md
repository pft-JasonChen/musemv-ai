---
description: Run a design + accessibility review of a route against the spec and breakpoints.
---
Review the UI of the route the user names (default `/mv/room`).

Steps:
1. Ensure the app is running (`npm run dev` or `npm run start`).
2. Use the Playwright MCP (or `npm run e2e`) to load the route at 390 / 768 / 1024 / 1440 and screenshot each.
3. Inspect against `specs/` and `src/styles/tokens.css`: visual hierarchy, spacing rhythm, token fidelity (no off-palette colors), all states (empty/loading/error), and parity with the mobile prototype intent.
4. Run axe-core (`npm run e2e -- a11y`) and check the accessibility tree, focus order, Esc-to-close, and contrast.
5. Read the console for errors.

Output a prioritized list of concrete fixes, each with the file/selector. Then offer to apply them.
Reference the `design-reviewer` and `a11y-checker` subagents for deeper passes.
