# Screenshots — capture, sources, and focus frames

Phase 3 in full. `SKILL.md` states the rule; this is how to satisfy it.

---

## Capturing

1. **Confirm the server is reachable.** Hit `http://localhost:8000` (Chrome MCP). If unreachable, tell the user to run `./start-server.sh` and **stop** — do not screenshot from the Linux sandbox and never use `file://`.
2. Drive the prototype through **every state** in every path (and one capture per page section). Capture at **1440px** wide (desktop) only — the spec carries the 1440 view. Do not capture or embed 1024/768 screens in the spec (the per-path `responsive` field is deprecated).
3. Save PNGs to `Project/<feature>/specs/screenshots/` named `NN_name.png` (e.g. `03_trim_dialog.png`). The `NN_name.png` filename is exactly what each step's `shot` key references.

**Driving states (important).** Do not pixel-click the OS file picker — it cannot be automated. Most prototypes expose global state functions (e.g. `showState(...)`, `showResult(...)`) or accept state via the browser JS console. Prefer the JS console / global functions to jump straight to each state, then screenshot — driving JS for capture is fine; JS detail still never enters the spec text.

**Measure focus boxes while capturing.** In the same state, before/after each shot, measure the user-action element's bounding box relative to the captured container and append it to `specs/focus.json`. The builder applies it automatically (see the `focus` note in Phase 4). This is the only reliable way to make the red box match the screenshot exactly — never hand-tune percentages for a final spec.

**Two screenshot sources (pick one per spec, state it in the build script's docstring).**
- **Prototype capture (default).** Playwright drives the running prototype; `capture_screenshots.py` measures each focus box and writes `specs/focus.json`, which overrides the manual `focus` in the build script. This is the reproducible path — prefer it.
- **Design-mockup mode.** When the user wants the designer's own frames (exported from a proposal deck or Figma) instead of prototype captures, there is no running page to measure, so `focus.json` cannot be generated. In that mode set `focus_lock: True` on every step and measure the boxes **once** against the exported image, then never re-tune by eye. Record the choice and the export source in the build script's docstring so a later session does not "fix" it back to prototype captures. Exemplar: `Project/2026-07-03-template-spec/build_spec.py`.

**Reproducibility — capture once, never redo.** Screenshots get needlessly recaptured when capture tooling breaks across sessions. Prevent it:
- Put capture in `Project/<feature>/capture_screenshots.py` — **flow logic only**, built on the shared harness `skills/yco-spec/capture_lib.py` (`from capture_lib import Capture`, async context manager). The lib owns env/browser bootstrap, the throwaway server on an auto-picked free port, `shot()`/`focus()`, focus.json output, and console-error collection. Never copy that boilerplate back into a feature script, never hardcode a port. Exemplar: `Project/2026-05-20-support-chatbot/capture_screenshots.py`.
- **Derive every path from `__file__`** — never hardcode `/sessions/<name>/mnt/…`; that mount name changes each session and is the #1 cause of re-runs.
- **Persist the browser binary in-repo** so it downloads once, not per session (the lib sets `PLAYWRIGHT_BROWSERS_PATH` to `.tools/ms-playwright` before importing Playwright).
- **Commit the PNGs** in `specs/screenshots/`. Once captured they are reused by every build; recapture only when the UI actually changes.
- Don't rely on the Chrome MCP `save_to_disk` for spec screenshots — it doesn't reliably persist. Use the Playwright capture script.
