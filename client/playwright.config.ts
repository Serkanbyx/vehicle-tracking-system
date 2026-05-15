import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],

  webServer: process.env.CI
    ? undefined
    : [
        {
          command: "cd ../server && npm run dev",
          port: 5000,
          reuseExistingServer: true,
          timeout: 30_000,
        },
        {
          command: "npm run dev",
          port: 3000,
          reuseExistingServer: true,
          timeout: 30_000,
        },
      ],
});
