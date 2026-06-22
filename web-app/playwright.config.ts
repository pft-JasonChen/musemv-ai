import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 20000 },
  use: { baseURL: "http://localhost:3100", browserName: "chromium" },
  webServer: {
    command: "next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
