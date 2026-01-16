import { test, expect } from '@playwright/test';

test.describe('Cosmic CV Journey', () => {

    test.beforeEach(async ({ page }) => {
        // Go to the starting url
        await page.goto('http://localhost:3000');
        // Wait for loader to disappear
        await page.waitForSelector('.loader', { state: 'hidden', timeout: 10000 });
    });

    test('should have correct metadata', async ({ page }) => {
        await expect(page).toHaveTitle(/The Architect's Universe/);
    });

    test('should show hero section initially', async ({ page }) => {
        await expect(page.locator('.hero-title')).toBeVisible();
        await expect(page.locator('.hero-title')).toHaveText("THE ARCHITECT'S UNIVERSE");
    });

    test('should reveal Earth Holocard on scroll', async ({ page }) => {
        // Scroll to Earth Section (approximate pixel value or element)
        // Since we use scroll-container, we can scroll the window or container

        // Find the Earth scene element
        const earthSection = page.locator('.scene--earth');

        // Scroll until Earth section is in view
        await earthSection.scrollIntoViewIfNeeded();

        // Simulate waiting for scroll animation
        await page.waitForTimeout(2000);

        // Check if Holocard is visible
        const holocard = page.locator('.holocard-wrapper');
        await expect(holocard).toHaveClass(/visible/);

        // Check content
        await expect(page.locator('.center-panel h2')).toHaveText('EARTH');
        await expect(page.locator('.center-panel .subtitle')).toHaveText('ORIGIN & FOUNDATION');
    });

    test('should reveal Moon Holocard on further scroll', async ({ page }) => {
        const moonSection = page.locator('.scene--moon');
        await moonSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(2000);

        const holocard = page.locator('.holocard-wrapper');
        await expect(holocard).toHaveClass(/visible/);
        await expect(page.locator('.center-panel h2')).toHaveText('THE MOON');
    });

});
