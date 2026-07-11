import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 20000 },
  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    // Sandboxed CI/agent environments provide a system chromium instead of a
    // playwright-managed download; point CHROMIUM_PATH at it to skip the download.
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: {
    command: "next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
