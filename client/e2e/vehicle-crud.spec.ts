import { expect, test } from "@playwright/test";
import { login, MANAGER, seedTestData, uniqueId } from "./helpers";

test.beforeAll(() => {
  seedTestData();
});

test.describe("Vehicle CRUD E2E", () => {
  test("Manager creates a vehicle → edits it → deletes it", async ({ page }) => {
    const uid = uniqueId();
    const plate = `34 E2E ${uid}`;

    await login(page, MANAGER);

    /* ── 1. Create vehicle ── */
    await page.goto("/vehicles/new");
    await page.waitForLoadState("networkidle");

    await page.getByLabel(/plaka/i).fill(plate);

    const typeSelect = page.getByLabel(/tür/i);
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("truck");
    }

    await page.getByLabel("Model").fill("Volvo FH16");
    await page.getByLabel("Renk").fill("Beyaz");

    const driverNameInput = page.getByLabel("İsim").or(page.getByLabel(/sürücü.*isim/i));
    if (await driverNameInput.isVisible()) {
      await driverNameInput.fill("Test Driver");
    }

    await page.getByRole("button", { name: /oluştur/i }).click();

    /* ── Should navigate to vehicle detail ── */
    await expect(page).toHaveURL(/\/vehicles\//);
    await expect(page.locator("body")).toContainText(plate);

    /* ── 2. Edit vehicle ── */
    const editBtn = page
      .getByRole("link", { name: /düzenle|edit/i })
      .or(page.getByRole("button", { name: /düzenle|edit/i }));
    await editBtn.click();
    await page.waitForLoadState("networkidle");

    const colorInput = page.getByLabel("Renk");
    await colorInput.clear();
    await colorInput.fill("Mavi");

    await page.getByRole("button", { name: /güncelle|update/i }).click();

    await expect(page).toHaveURL(/\/vehicles\//);
    await expect(page.locator("body")).toContainText("Mavi");

    /* ── 3. Delete vehicle ── */
    const deleteBtn = page.getByRole("button", { name: /sil|delete/i });
    await deleteBtn.click();

    const confirmDelete = page.getByRole("button", { name: /onayla|evet|confirm|sil/i }).last();
    if (await confirmDelete.isVisible()) {
      await confirmDelete.click();
    }

    await expect(page).toHaveURL(/\/vehicles$/);
  });
});
