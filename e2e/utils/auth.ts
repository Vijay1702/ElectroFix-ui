import { Page } from "@playwright/test";
import { API_BASE_URL } from "./env";
import { E2E_PASSWORD, E2E_USERS } from "./fixtures-data";

// Real form fill + submit — for auth.spec.ts and the full-workflow journey,
// where exercising the actual login UI is the point.
export async function loginViaUI(page: Page, email: string, password: string = E2E_PASSWORD) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign In to System" }).click();
  await page.waitForURL("**/dashboard");
}

// Fast path for page-level tests that don't care about the login flow itself.
// AuthGuard (src/routes/index.tsx) only checks that localStorage.accessToken is
// truthy, it never validates the token — but every page still makes real API
// calls with it, so this performs a real login against the running API and
// seeds a genuinely valid token rather than a fake one (which would just 401
// on the first request and bounce back to /login via the axios interceptor).
export async function loginViaStorage(page: Page, role: keyof typeof E2E_USERS) {
  const user = E2E_USERS[role];
  const res = await page.request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: user.email, password: E2E_PASSWORD },
  });
  const body = await res.json();

  await page.goto("/login");
  await page.evaluate(
    ({ token, userData }) => {
      window.localStorage.setItem("accessToken", token);
      window.localStorage.setItem("user", JSON.stringify(userData));
    },
    { token: body.data.accessToken, userData: body.data.user }
  );
  await page.goto("/dashboard");
}
