import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Vérifie que la page se charge
  await expect(page).toHaveTitle(/Stage-Impot/i);
});

test('login screen is displayed', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Vérifie que l'écran de connexion est affiché
  const loginScreen = page.locator('text=Login');
  await expect(loginScreen).toBeVisible();
});
