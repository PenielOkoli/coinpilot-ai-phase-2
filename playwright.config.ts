import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3148",
    headless: true,
    ...(process.platform === "win32" ? { channel: "msedge" } : {}),
    viewport: { width: 1440, height: 1100 },
  },
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: "npm run start -- --port 3148",
        url: "http://localhost:3148",
        reuseExistingServer: false,
      },
});
