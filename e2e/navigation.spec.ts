import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to diagrams page', async ({ page }) => {
    // Start the dev server and navigate to home page
    await page.goto('http://localhost:5173/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click on the Diagrams navigation link
    await page.click('text=Diagrams');
    
    // Verify we're on the diagrams page by checking URL
    await expect(page).toHaveURL('http://localhost:5173/diagramas');
    
    // Verify the page has the expected content (looking for either h1 or canvas presence)
    // Check for h1 with "Nuevo Diagrama" or presence of React Flow canvas
    const hasNewDiagramHeading = page.locator('h2:has-text("Nuevo Diagrama")');
    const hasCanvas = page.locator('[data-testid^="rf__wrapper"]');
    
    // Wait for either the diagram creation form or the canvas to be visible
    await expect(hasNewDiagramHeading.or(hasCanvas)).toBeVisible({ timeout: 10000 });
  });

  test('should show active state for diagrams navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/diagramas');
    await page.waitForLoadState('networkidle');
    
    // Check that the Diagrams navigation link has active styling
    const diagramsLink = page.locator('a[href="/diagramas"]');
    await expect(diagramsLink).toHaveClass(/text-\[#1280ff\]/);
  });
});