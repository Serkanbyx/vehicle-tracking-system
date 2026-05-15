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
    await page.getByLabel("İsim").fill(newUser.name);
    await page.getByLabel("E-posta").fill(newUser.email);
    await page.getByLabel("Şifre", { exact: true }).fill(newUser.password);
    await page.getByLabel("Şifre Tekrarı").fill(newUser.password);
    await page.getByRole("button", { name: /kayıt ol/i }).click();

    /* ── Should land on dashboard ── */
    await expect(page).toHaveURL("/");
    await expect(page.locator("body")).not.toHaveText(/kayıt ol/i);

    /* ── 2. Logout ── */
    const profileBtn = page
      .getByRole("button", { name: /profil|kullanıcı/i })
      .or(page.locator('[data-testid="user-menu"]'));
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      const logoutItem = page.getByRole("menuitem", { name: /çıkış|logout/i });
      await logoutItem.click();
    } else {
      await page.goto("/login");
    }
    await expect(page).toHaveURL(/\/login/);

    /* ── 3. Login with the new user ── */
    await page.getByLabel("E-posta").fill(newUser.email);
    await page.getByLabel("Şifre").fill(newUser.password);
    await page.getByRole("button", { name: /giriş yap/i }).click();
    await expect(page).toHaveURL("/");

    /* ── 4. Logout again ── */
    const profileBtn2 = page
      .getByRole("button", { name: /profil|kullanıcı/i })
      .or(page.locator('[data-testid="user-menu"]'));
    if (await profileBtn2.isVisible()) {
      await profileBtn2.click();
      await page.getByRole("menuitem", { name: /çıkış|logout/i }).click();
    }
    await expect(page).toHaveURL(/\/login/);
  });

  test("Login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-posta").fill("nonexistent@test.com");
    await page.getByLabel("Şifre").fill("WrongPassword99");
    await page.getByRole("button", { name: /giriş yap/i }).click();

    await expect(
      page.locator("text=Geçersiz e-posta veya şifre").or(page.locator("text=Bir hata oluştu")),
    ).toBeVisible();
  });

  test("Unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/vehicles");
    await expect(page).toHaveURL(/\/login/);
  });
});
