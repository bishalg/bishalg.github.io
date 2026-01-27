import { test, expect } from '@playwright/test';

test.describe('Paged Scroll & UI Refinements', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the starting page
        await page.goto('http://localhost:3030');
        // Wait for loader or initial content
        await page.waitForSelector('.start-btn', { state: 'visible', timeout: 10000 });
        // Click start to enter the scroll view
        await page.click('.start-btn');
        // Wait for the first page/planet to be visible
        await page.waitForSelector('#planet-sun', { timeout: 10000 });
    });

    test('Next button should be visible and functional', async ({ page }) => {
        const nextBtn = page.locator('.holocard-next-btn');

        // Check visibility
        await expect(nextBtn).toBeVisible();
        await expect(nextBtn).toHaveCSS('opacity', '1');
        await expect(nextBtn).toHaveCSS('bottom', '32px'); // 2rem = 32px
        await expect(nextBtn).toHaveCSS('right', '32px');

        // Click and verify navigation
        // Current URL should probably be ?planet=sun (or similar default)
        // Clicking next should move to the next card or planet
        const initialUrl = page.url();
        await nextBtn.click();

        // Wait for scroll/transition
        await page.waitForTimeout(1000);

        // Verify URL changed or scroll position changed
        const newUrl = page.url();
        expect(newUrl).not.toBe(initialUrl);
        expect(newUrl).toContain('card=');
    });

    test('Cards should not have internal scrollbars', async ({ page }) => {
        // Navigate to a card with content (e.g. Earth Foundation or Sun Leadership)
        // We can use the URL to jump directly if deep linking works, 
        // but let's scroll to it to be safe or use the next button.

        // Let's jump to Earth card 1 via URL
        await page.goto('http://localhost:3030/?planet=earth&card=1');
        await page.waitForSelector('.holo-card.visible', { timeout: 10000 });

        const cardContent = page.locator('.holo-card.visible .card-content');

        // Check overflow style
        await expect(cardContent).toHaveCSS('overflow', 'hidden');

        // Check that scrollHeight is not significantly larger than clientHeight
        // OR just rely on overflow: hidden verification which we requested.
    });

    test('URL should update on scroll', async ({ page }) => {
        // Scroll down by one viewport height
        await page.mouse.wheel(0, 800); // approximate vh
        await page.waitForTimeout(1000); // wait for snap

        const url = page.url();
        expect(url).toMatch(/planet=|card=/);
    });
});
