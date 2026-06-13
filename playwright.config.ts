import { defineConfig } from "@playwright/test";

export default defineConfig({
  globalSetup: "./test/e2e/global-setup.ts",
  globalTeardown: "./test/e2e/global-teardown.ts",
  outputDir: "../output/playwright",
  testDir: "./test/e2e",
  timeout: 90_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  workers: 1,
});
