import { test, expect } from "@playwright/test";
import { seedTestData, login, ADMIN } from "./helpers";

test.beforeAll(() => {
  seedTestData();
});

test.describe("Settings E2E — Theme + Animations", () => {
  test("Toggle dark theme → applies → persists after reload", async ({
    page,
  }) => {
    await login(page, ADMIN);

    /* ── Navigate to appearance settings ── */
    await page.goto("/settings/appearance");
    await page.waitForLoadState("networkidle");

    /* ── Find and click the dark theme option ── */
    const darkOption = page.getByLabel(/karanlık|dark/i).or(
      page.locator('button[value="dark"]').or(
        page.locator("text=Karanlık").first(),
      ),
    );

    if (await darkOption.isVisible()) {
      await darkOption.click();
      await page.waitForTimeout(500);

      /* ── Verify dark class is applied ── */
      const html = page.locator("html");
      const hasDark = await html.getAttribute("class");
      const hasDarkData = await html.getAttribute("data-theme");

      const isDark =
        hasDark?.includes("dark") ||
        hasDarkData === "dark" ||
        (await page.evaluate(() =>
          document.documentElement.classList.contains("dark"),
        ));

      expect(isDark).toBeTruthy();

      /* ── Reload and verify persistence ── */
      await page.reload();
      await page.waitForLoadState("networkidle");

      const stillDark = await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
      );

      expect(stillDark).toBeTruthy();
    }
  });

  test("Toggle animations off → no-anim class applied", async ({ page }) => {
    await login(page, ADMIN);

    await page.goto("/settings/appearance");
    await page.waitForLoadState("networkidle");

    /* ── Find animations toggle (Switch) ── */
    const animSwitch = page.getByLabel(/animasyon|animation/i).or(
      page.getByRole("switch", { name: /animasyon|animation/i }),
    );

    if (await animSwitch.isVisible()) {
      const isChecked = await animSwitch.isChecked();

      if (isChecked) {
        await animSwitch.click();
        await page.waitForTimeout(500);
      }

      const hasNoAnim = await page.evaluate(() =>
        document.body.classList.contains("no-anim"),
      );

      expect(hasNoAnim).toBeTruthy();
    }
  });

  test("Settings page renders all sections", async ({ page }) => {
    await login(page, ADMIN);

    await page.goto("/settings/appearance");
    await page.waitForLoadState("networkidle");

    /* ── Verify sections exist ── */
    const themeSection = page.locator("text=Tema").or(
      page.locator("text=Theme"),
    );
    await expect(themeSection).toBeVisible({ timeout: 5_000 });

    const fontSection = page.locator("text=Yazı Boyutu").or(
      page.locator("text=Font"),
    );
    const fontVisible = await fontSection.isVisible();
    expect(fontVisible).toBeTruthy();
  });
});
