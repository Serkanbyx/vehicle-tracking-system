import { type Page, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import path from "node:path";

/* ── Test credentials (matching seed-test.ts) ── */

export const ADMIN = {
  name: "E2E Admin",
  email: "e2e-admin@test.com",
  password: "AdminPass123",
};

export const MANAGER = {
  name: "E2E Manager",
  email: "e2e-manager@test.com",
  password: "ManagerPass123",
};

export const VIEWER = {
  name: "E2E Viewer",
  email: "e2e-viewer@test.com",
  password: "ViewerPass123",
};

/* ── Seed helpers ── */

let seeded = false;

export function seedTestData(): void {
  if (seeded) return;
  const serverDir = path.resolve(__dirname, "../../server");
  execSync("npm run seed:test", { cwd: serverDir, stdio: "pipe" });
  seeded = true;
}

/* ── Auth helpers ── */

export async function login(
  page: Page,
  user: { email: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(user.email);
  await page.getByLabel("Şifre").fill(user.password);
  await page.getByRole("button", { name: /giriş yap/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: /profil|kullanıcı|menu/i }).click();
  await page.getByRole("menuitem", { name: /çıkış|logout/i }).click();
  await expect(page).toHaveURL(/\/login/);
}

/* ── Navigation helpers ── */

export async function navigateTo(
  page: Page,
  path: string,
): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/* ── Unique string for test isolation ── */

export function uniqueId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
