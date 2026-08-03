import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, devices } from "@playwright/test";
import { API_BASE_URL, API_PORT, DATABASE_URL, UI_BASE_URL, UI_PORT } from "./e2e/utils/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This suite spins up its own sibling API instance (../ElectroFix-API) against
// a dedicated test DB (electrofix_ui_test — separate from the backend suite's
// electrofix_test so both suites can run independently without colliding),
// plus a Vite dev server pointed at that API instance. Ports are offset from
// both the developer's normal dev servers (5000/5173) and the backend suite's
// own test server (5001) so nothing collides if things run back-to-back.
const API_ROOT = path.resolve(__dirname, "..", "ElectroFix-API");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // specs share one DB; workers:1 keeps ordering sane
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  globalSetup: path.resolve(__dirname, "e2e/global-setup.ts"),
  use: {
    baseURL: UI_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Taller than the default 720px: the app's side Drawers have their own
    // internal scroll container, and scrollIntoViewIfNeeded() wasn't reliably
    // bringing fields in longer forms (e.g. the repair edit form's "Current
    // Status" field) into a clickable position within it. Simplest fix is
    // giving every test enough vertical room that this never comes up.
    viewport: { width: 1280, height: 1600 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev",
      cwd: API_ROOT,
      url: `http://localhost:${API_PORT}/`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ...(process.env as Record<string, string>),
        SKIP_DOTENV: "true",
        PORT: String(API_PORT),
        DATABASE_URL,
        CORS_ORIGIN: UI_BASE_URL,
        JWT_SECRET: "electrofix_e2e_jwt_secret",
        JWT_EXPIRES_IN: "7d",
        JWT_REFRESH_SECRET: "electrofix_e2e_refresh_secret",
        JWT_REFRESH_EXPIRES_IN: "30d",
        API_PREFIX: "/api/v1",
        NODE_ENV: "development",
      },
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: `npx vite --port ${UI_PORT} --strictPort`,
      cwd: __dirname,
      url: UI_BASE_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ...(process.env as Record<string, string>),
        VITE_API_URL: API_BASE_URL,
      },
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
