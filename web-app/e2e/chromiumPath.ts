import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Resolves the Chromium executable to launch, for sandboxed environments whose
 * installed browser build predates Playwright's pinned one (see AGENTS.md's
 * `CHROMIUM_PATH` note).
 *
 * `CHROMIUM_PATH` is the documented mechanism when you run `npm run e2e`
 * yourself. But the Stop hook runs it too (`stop-verify.sh`'s G5), as a plain
 * `npm run e2e` inside a subprocess it spawns — there is no way to hand that
 * subprocess an env var from outside it. `.chromium-path-local` (gitignored,
 * one line, the executable's absolute path) is the fallback so the hook's own
 * run can find the same browser without needing the env var set.
 */
export function resolveChromiumPath(): string | undefined {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const local = join(__dirname, "..", ".chromium-path-local");
  if (!existsSync(local)) return undefined;
  const path = readFileSync(local, "utf8").trim();
  return path || undefined;
}
