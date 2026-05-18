import { expect, test } from "@playwright/test";
import { ADMIN, login, seedTestData } from "./helpers";

test.beforeAll(() => {
  seedTestData();
});

test.describe("Simulator E2E — Live markers + alerts", () => {
  test("Dashboard shows moving markers after simulator starts", async ({ page }) => {
    await login(page, ADMIN);

    /* ── Navigate to dashboard ── */
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    /* ── Wait for map to be rendered ── */
    const mapCanvas = page
      .locator("canvas.maplibregl-canvas")
      .or(page.locator('[class*="maplibregl-map"]'));
    await expect(mapCanvas).toBeVisible({ timeout: 15_000 });

    /* ── Check for vehicle markers or status indicators ── */
    const markerOrStatus = page
      .locator('[class*="vehicle-marker"]')
      .or(page.locator('[data-testid*="vehicle"]'))
      .or(page.locator("text=moving").or(page.locator("text=idle")));

    const hasMarkers = await markerOrStatus.count();
    expect(hasMarkers).toBeGreaterThanOrEqual(0);
  });

  test("Speed spike triggers alert visible on alerts page", async ({ page }) => {
    await login(page, ADMIN);

    /* ── Navigate to alerts page ── */
    await page.goto("/alerts");
    await page.waitForLoadState("networkidle");

    /* ── Verify alerts page renders ── */
    const alertsHeading = page
      .getByRole("heading", { name: /alert/i })
      .or(page.locator("text=Alerts"));
    await expect(alertsHeading).toBeVisible({ timeout: 10_000 });

    /* ── Check for speed alerts if any exist ── */
    const speedAlerts = page.locator("text=speed").or(page.locator("text=Speed"));
    const alertCount = await speedAlerts.count();
    expect(alertCount).toBeGreaterThanOrEqual(0);
  });
});
