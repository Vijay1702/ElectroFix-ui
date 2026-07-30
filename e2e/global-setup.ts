import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { DATABASE_URL } from "./utils/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.resolve(__dirname, "..", "..", "ElectroFix-API");

// Reuses the backend repo's own schema-sync + seed script rather than duplicating
// that logic here — this suite's DB (electrofix_ui_test) is separate from the
// backend suite's (electrofix_test) so the two can run independently.
export default function globalSetup() {
  const childEnv = { ...process.env, DATABASE_URL };

  console.log(`[ui e2e setup] Syncing schema + seeding electrofix_ui_test`);

  execSync("npx prisma db push --accept-data-loss --skip-generate", {
    cwd: API_ROOT,
    env: childEnv,
    stdio: "inherit",
  });

  execSync("npx ts-node prisma/seed.e2e.ts", {
    cwd: API_ROOT,
    env: childEnv,
    stdio: "inherit",
  });
}
