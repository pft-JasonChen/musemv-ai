import { defineConfig } from "@playwright/test";
import { resolveChromiumPath } from "./e2e/chromiumPath";

const chromiumPath = resolveChromiumPath();

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 20000 },
  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    // Sandboxed CI/agent environments provide a system chromium instead of a
    // playwright-managed download; point CHROMIUM_PATH at it to skip the download
    // (see `e2e/chromiumPath.ts` for the Stop-hook fallback when that env var
    // cannot be set from outside the hook's own subprocess).
    launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
  },
  webServer: {
    command: "next start -p 3100",
    url: "http://localhost:3100",
    // reuseExistingServer WAS true. That silently adopts whatever is already on
    // :3100 — and `next start` loads the build into memory at boot, so a server
    // left over from an earlier build serves STALE pages while the suite reports
    // on them as if they were current. It cost three separate false diagnoses in
    // one session: a wall of "visual diffs" that were really a 500ing CSS chunk
    // and unstyled 913x16891 screenshots, and a round of shell tests that could
    // not find `.sidebar` because the running server predated it.
    //
    // false makes Playwright start its own server and FAIL LOUDLY if the port is
    // taken, which is the right trade: a clear error beats a confident wrong answer.
    // If you hit that error, something else is on 3100 — kill it, don't re-enable this.
    reuseExistingServer: false,
    timeout: 60000,
  },
});
