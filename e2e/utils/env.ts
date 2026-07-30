// Single source of truth for the ports/DB this suite's webServer processes use
// — imported by playwright.config.ts, global-setup.ts, and test utils alike so
// there's exactly one place to change if a port or DB name ever needs to move.
export const API_PORT = 5002;
export const API_BASE_URL = `http://localhost:${API_PORT}/api/v1`;
export const UI_PORT = 5174;
export const UI_BASE_URL = `http://localhost:${UI_PORT}`;
export const DATABASE_URL = "postgresql://postgres:password@localhost:5432/electrofix_ui_test";
