import { test, expect } from '@playwright/test';

test('application loads successfully', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3000');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check that we're on the correct page
  await expect(page).toHaveURL(/localhost:3000/);
  
  // Verify the page title contains something
  await expect(page).toHaveTitle(/.*/);
});

test('page has content', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check that the page has some visible content
  const body = page.locator('body');
  await expect(body).toBeVisible();
  
  // Verify that the root div exists
  const root = page.locator('#root');
  await expect(root).toBeAttached();
});
