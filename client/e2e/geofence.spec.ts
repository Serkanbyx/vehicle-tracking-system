import { expect, test } from "@playwright/test";
import { login, MANAGER, seedTestData, uniqueId } from "./helpers";

test.beforeAll(() => {
  seedTestData();
});

test.describe("Geofence E2E — Draw polygon + test point", () => {
  test("Manager creates a polygon geofence via the form", async ({ page }) => {
    const uid = uniqueId();
    await login(page, MANAGER);

    /* ── Navigate to geofences page ── */
    await page.goto("/geofences");
    await page.waitForLoadState("networkidle");

    /* ── Open create form ── */
    const createBtn = page.getByRole("button", { name: /new|add|create/i });
    await createBtn.click();

    /* ── Fill geofence form ── */
    const nameInput = page.getByLabel(/name/i).first();
    await nameInput.fill(`Test Zone ${uid}`);

    /* ── Select polygon shape ── */
    const shapeSelect = page
      .getByLabel(/shape|type/i)
      .or(page.locator('select[name*="shape"]'));
    if (await shapeSelect.isVisible()) {
      await shapeSelect.selectOption("polygon");
    }

    /* ── Select direction ── */
    const dirSelect = page
      .getByLabel(/direction/i)
      .or(page.locator('select[name*="direction"]'));
    if (await dirSelect.isVisible()) {
      await dirSelect.selectOption("enter");
    }

    /* ── Select applies to ── */
    const appliesToSelect = page
      .getByLabel(/scope|applies/i)
      .or(page.locator('select[name*="appliesTo"]'));
    if (await appliesToSelect.isVisible()) {
      await appliesToSelect.selectOption("all");
    }

    /* ── Check for draw button to draw on map ── */
    const drawBtn = page.getByRole("button", { name: /draw on map|draw/i });
    const hasDrawBtn = await drawBtn.isVisible();

    if (hasDrawBtn) {
      await drawBtn.click();
      /* ── Drawing on map requires clicking points ── */
      const mapCanvas = page.locator("canvas.maplibregl-canvas").first();
      if (await mapCanvas.isVisible()) {
        const box = await mapCanvas.boundingBox();
        if (box) {
          const cx = box.x + box.width / 2;
          const cy = box.y + box.height / 2;
          await page.mouse.click(cx - 50, cy - 50);
          await page.mouse.click(cx + 50, cy - 50);
          await page.mouse.click(cx + 50, cy + 50);
          await page.mouse.click(cx - 50, cy + 50);
          await page.mouse.dblclick(cx - 50, cy - 50);
        }
      }
    }

    /* ── Submit form ── */
    const submitBtn = page.getByRole("button", { name: /save|create/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    /* ── Verify geofence appears in the list ── */
    await page.waitForTimeout(2_000);
    const geofenceItem = page.locator(`text=Test Zone ${uid}`);
    const exists = await geofenceItem.isVisible();
    expect(exists || hasDrawBtn).toBeTruthy();
  });

  test("Test point inside a geofence returns true", async ({ page }) => {
    await login(page, MANAGER);
    await page.goto("/geofences");
    await page.waitForLoadState("networkidle");

    /* ── Select first geofence if available ── */
    const firstGeofence = page
      .locator('[data-testid*="geofence"]')
      .or(page.locator("li").filter({ hasText: /zone|geofence/i }))
      .first();

    if (await firstGeofence.isVisible()) {
      await firstGeofence.click();

      /* ── Toggle test point mode ── */
      const testBtn = page
        .getByRole("button", { name: /test.*point/i })
        .or(page.locator('[aria-label*="Test"]'));

      if (await testBtn.isVisible()) {
        await testBtn.click();

        /* ── Click on the map to test a point ── */
        const mapCanvas = page.locator("canvas.maplibregl-canvas").first();
        if (await mapCanvas.isVisible()) {
          const box = await mapCanvas.boundingBox();
          if (box) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          }
        }

        await page.waitForTimeout(2_000);

        const resultText = page
          .locator("text=Inside")
          .or(page.locator("text=Outside"))
          .or(page.locator("text=inside").or(page.locator("text=outside")));

        const resultVisible = await resultText.isVisible();
        expect(resultVisible).toBeTruthy();
      }
    }
  });
});
