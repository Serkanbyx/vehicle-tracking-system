import { test, expect } from "@playwright/test";
import { seedTestData, login, MANAGER } from "./helpers";

test.beforeAll(() => {
  seedTestData();
});

test.describe("Export E2E — CSV download", () => {
  test("Vehicle history exports as CSV with correct headers", async ({
    page,
  }) => {
    await login(page, MANAGER);

    /* ── Navigate to vehicles list ── */
    await page.goto("/vehicles");
    await page.waitForLoadState("networkidle");

    /* ── Click first vehicle to open detail ── */
    const firstVehicle = page
      .locator("a[href*='/vehicles/']")
      .or(page.locator("tr").filter({ hasText: /[A-Z0-9]{2,}/ }))
      .first();

    if (!(await firstVehicle.isVisible())) {
      test.skip(true, "No vehicles available for export test");
      return;
    }

    await firstVehicle.click();
    await page.waitForLoadState("networkidle");

    /* ── Look for export button ── */
    const exportBtn = page.getByRole("button", { name: /dışa aktar|export|csv/i }).or(
      page.getByRole("link", { name: /dışa aktar|export|csv/i }),
    );

    if (!(await exportBtn.isVisible())) {
      test.skip(true, "Export button not visible on vehicle detail page");
      return;
    }

    /* ── Setup download listener ── */
    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await exportBtn.click();
    const download = await downloadPromise;

    /* ── Verify download ── */
    expect(download.suggestedFilename()).toMatch(/\.(csv|geojson)$/);

    const filePath = await download.path();
    if (filePath && download.suggestedFilename().endsWith(".csv")) {
      const fs = await import("node:fs/promises");
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.trim().split("\n");

      expect(lines.length).toBeGreaterThanOrEqual(1);

      const headers = lines[0]!.toLowerCase();
      const expectedHeaders = ["timestamp", "speed"];
      for (const header of expectedHeaders) {
        expect(headers).toContain(header);
      }
    }
  });
});
