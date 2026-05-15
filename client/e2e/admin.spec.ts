import { test, expect } from "@playwright/test";
import { seedTestData, login, ADMIN, VIEWER, uniqueId } from "./helpers";

test.beforeAll(() => {
  seedTestData();
});

test.describe("Admin E2E — Role promotion", () => {
  test("Admin promotes a viewer to manager → user can create vehicles", async ({
    page,
    context,
  }) => {
    /* ── 1. Login as admin ── */
    await login(page, ADMIN);

    /* ── 2. Navigate to admin users page ── */
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    /* ── 3. Find the viewer user row ── */
    const viewerRow = page.locator("tr", { hasText: VIEWER.email });
    await expect(viewerRow).toBeVisible({ timeout: 10_000 });

    /* ── 4. Click role change action ── */
    const roleBtn = viewerRow.getByRole("button", { name: /rol|role/i }).or(
      viewerRow.locator('[data-testid="change-role"]'),
    );

    if (await roleBtn.isVisible()) {
      await roleBtn.click();

      const managerOption = page.getByRole("option", { name: /manager/i }).or(
        page.locator("text=Manager").first(),
      );
      await managerOption.click();

      const confirmBtn = page.getByRole("button", { name: /onayla|kaydet|confirm|save/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }

    /* ── 5. Verify role badge updated ── */
    await expect(
      viewerRow.locator("text=Manager").or(viewerRow.locator("text=manager")),
    ).toBeVisible({ timeout: 5_000 });

    /* ── 6. Login as the promoted user in a new page ── */
    const promotedPage = await context.newPage();
    await login(promotedPage, VIEWER);

    /* ── 7. Promoted user can now access vehicle creation ── */
    await promotedPage.goto("/vehicles/new");
    await expect(promotedPage).not.toHaveURL(/\/login/);

    const plateInput = promotedPage.getByLabel(/plaka/i);
    await expect(plateInput).toBeVisible({ timeout: 5_000 });

    await promotedPage.close();
  });
});
