// Mirrors ElectroFix-API/prisma/e2e-fixtures.ts. Duplicated (not imported)
// deliberately — these are two independently-runnable Playwright projects in
// separate repos, and this is 5 lines of stable data, not worth a cross-repo
// TS project reference. Keep in sync if the backend's e2e seed users change.
export const E2E_PASSWORD = "Test@1234";

export const E2E_USERS = {
  ADMIN: { email: "admin@e2e.test", fullName: "E2E Admin", role: "ADMIN" },
  TECHNICIAN: { email: "tech@e2e.test", fullName: "E2E Technician", role: "TECHNICIAN" },
  MONITOR: { email: "monitor@e2e.test", fullName: "E2E Monitor", role: "MONITOR" },
  STAFF: { email: "staff@e2e.test", fullName: "E2E Staff", role: "STAFF" },
};
