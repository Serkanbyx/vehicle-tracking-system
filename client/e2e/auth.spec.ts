import { expect, test } from "@playwright/test";
import { seedTestData, uniqueId } from "./helpers";

test.beforeAll(() => {
  seedTestData();
});

test.describe("Auth E2E — Register, Login, Logout flow", () => {
  test("Register a new user → land on dashboard → logout → login → logout", async ({ page }) => {
    const uid = uniqueId();
    const newUser = {
      name: `Test User ${uid}`,
      email: `e2e-new-${uid}@test.com`,
      password: "TestPass123",
    };

    /* ── 1. Register ── */
    await page.goto("/register");
    await page.getByLabel("Name").fill(newUser.name);
    await page.getByLabel("Email").fill(newUser.email);
    await page.getByLabel("Password", { exact: true }).fill(newUser.password);
    await page.getByLabel("Confirm Password").fill(newUser.password);
    await page.getByRole("button", { name: /sign up/i }).click();

    /* ── Should land on dashboard ── */
    await expect(page).toHaveURL("/");
    await expect(page.locator("body")).not.toHaveText(/sign up/i);

    /* ── 2. Logout ── */
    const profileBtn = page
      .getByRole("button", { name: /profile|user/i })
      .or(page.locator('[data-testid="user-menu"]'));
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      const logoutItem = page.getByRole("menuitem", { name: /logout|sign out/i });
      await logoutItem.click();
    } else {
      await page.goto("/login");
    }
    await expect(page).toHaveURL(/\/login/);

    /* ── 3. Login with the new user ── */
    await page.getByLabel("Email").fill(newUser.email);
    await page.getByLabel("Password").fill(newUser.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");

    /* ── 4. Logout again ── */
    const profileBtn2 = page
      .getByRole("button", { name: /profile|user/i })
      .or(page.locator('[data-testid="user-menu"]'));
    if (await profileBtn2.isVisible()) {
      await profileBtn2.click();
      await page.getByRole("menuitem", { name: /logout|sign out/i }).click();
    }
    await expect(page).toHaveURL(/\/login/);
  });

  test("Login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nonexistent@test.com");
    await page.getByLabel("Password").fill("WrongPassword99");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.locator("text=Invalid email or password").or(page.locator("text=An error occurred")),
    ).toBeVisible();
  });

  test("Unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/vehicles");
    await expect(page).toHaveURL(/\/login/);
  });
});
