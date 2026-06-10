import { test, expect } from '@playwright/test';

/**
 * Paged scroll & UI refinement tests — validates scroll-snap navigation,
 * next button behavior, card overflow, and URL sync.
 *
 * Architecture: CSS scroll-snap container (#scroll-container), 37 pages,
 * IntersectionObserver driving Holocard visibility.
 */
test.describe('Paged Scroll & UI Refinements', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3030');
        // Wait for loader to be removed from DOM entirely
        await page.waitForSelector('#loader', { state: 'detached', timeout: 15000 });
    });

    test('next button is fixed-positioned and always accessible', async ({ page }) => {
        const nextBtn = page.locator('.holocard-next-btn');
        await expect(nextBtn).toBeVisible();
        // CSS: position:fixed; bottom:2rem; right:2rem (= 32px at default font size)
        await expect(nextBtn).toHaveCSS('position', 'fixed');
        await expect(nextBtn).toHaveCSS('bottom', '32px');
        await expect(nextBtn).toHaveCSS('right', '32px');
    });

    test('next button navigates to next page', async ({ page }) => {
        // Navigate to a card page first
        await page.locator('#earth-1').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);

        const initialUrl = page.url();
        const nextBtn = page.locator('.holocard-next-btn');
        await expect(nextBtn).toBeVisible();
        await nextBtn.click();

        // Wait for snap scroll + observer to fire
        await page.waitForTimeout(1500);

        const newUrl = page.url();
        expect(newUrl).not.toBe(initialUrl);
        expect(newUrl).toContain('card=');
    });

    test('card content does not overflow its container', async ({ page }) => {
        await page.goto('http://localhost:3030/?planet=earth&card=1');
        await page.waitForSelector('#loader', { state: 'detached', timeout: 15000 });
        await page.waitForTimeout(1000);

        // Wait for the holocard wrapper to be in visible state
        await page.waitForSelector('.holocard-wrapper.visible', { timeout: 5000 });

        // Check the first card's content overflow (all cards share the same CSS rule)
        const cardContent = page.locator('.holo-card .card-content').first();
        // CSS requires overflow: hidden to prevent internal scrollbars
        const overflow = await cardContent.evaluate(el => getComputedStyle(el).overflow);
        expect(['hidden', 'hidden hidden']).toContain(overflow);
    });

    test('URL updates when scrolling to a planet page', async ({ page }) => {
        await page.locator('#earth-0').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        const url = page.url();
        // After scrolling to earth-0, URL should contain planet=earth
        expect(url).toMatch(/planet=earth/);
    });

    test('URL updates when scrolling to a card page', async ({ page }) => {
        await page.locator('#earth-2').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        const url = page.url();
        expect(url).toContain('planet=earth');
        expect(url).toContain('card=2');
    });

    test('first planet page does NOT show holocard wrapper', async ({ page }) => {
        await page.locator('#earth-0').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Planet view (card=0) → wrapper must be hidden
        const wrapper = page.locator('.holocard-wrapper');
        await expect(wrapper).not.toHaveClass(/visible/);
    });

    test('card page shows holocard wrapper', async ({ page }) => {
        await page.locator('#earth-1').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);

        const wrapper = page.locator('.holocard-wrapper');
        await expect(wrapper).toHaveClass(/visible/, { timeout: 3000 });
    });

    test('deep link ?planet=sun&card=1 shows sun card without manual scroll', async ({ page }) => {
        await page.goto('http://localhost:3030/?planet=sun&card=1');
        await page.waitForSelector('#loader', { state: 'detached', timeout: 15000 });
        await page.waitForTimeout(1000);

        // #sun-1 should be in viewport
        const sunCard = page.locator('#sun-1');
        await expect(sunCard).toBeInViewport({ ratio: 0.5 });
    });

    test('scroll-snap prevents fractional page positions', async ({ page }) => {
        const container = page.locator('#scroll-container');
        await expect(container).toBeVisible();

        // After scrolling, scrollTop should be a multiple of viewport height
        await page.locator('#earth-1').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);

        const { scrollTop, clientHeight } = await container.evaluate(el => ({
            scrollTop: el.scrollTop,
            clientHeight: el.clientHeight
        }));

        // Allow 5px tolerance for sub-pixel rounding
        const remainder = scrollTop % clientHeight;
        expect(remainder).toBeLessThan(5);
    });
});
