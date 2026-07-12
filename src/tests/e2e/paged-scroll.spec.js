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
        await page.goto('http://localhost:3030', { waitUntil: 'domcontentloaded' });
        // Loader removed from DOM once app finishes initializing
        await page.waitForSelector('#loader', { state: 'detached', timeout: 20000 });
    });

    test('next button is fixed-positioned and always accessible', async ({ page }) => {
        const nextBtn = page.locator('.holocard-next-btn');
        await expect(nextBtn).toBeVisible();
        // Centered fixed CTA: position:fixed; left:50%; bottom ≥ 24px
        await expect(nextBtn).toHaveCSS('position', 'fixed');
        const box = await nextBtn.boundingBox();
        const viewport = page.viewportSize();
        expect(box).toBeTruthy();
        expect(viewport).toBeTruthy();
        const btnCenterX = box.x + box.width / 2;
        expect(Math.abs(btnCenterX - viewport.width / 2)).toBeLessThan(8);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
        expect(box.y).toBeGreaterThan(viewport.height * 0.5);
    });

    test('next button navigates to next page', async ({ page }) => {
        // Navigate to a card page first
        await page.evaluate(() => document.getElementById('earth-1')?.scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(1500);

        const nextBtn = page.locator('.holocard-next-btn');
        await expect(nextBtn).toBeVisible();
        await nextBtn.click();

        // Wait for URL to update (IntersectionObserver fires after snap settles)
        // earth-1 → next button → earth-2, so URL must contain card=2
        await page.waitForURL(/card=2/, { timeout: 5000 });
        expect(page.url()).toContain('planet=earth');
        expect(page.url()).toContain('card=2');
    });

    test('card content stays within viewport and is scrollable if needed', async ({ page }) => {
        await page.goto('http://localhost:3030/?planet=earth&card=1', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#loader', { state: 'detached', timeout: 15000 });
        await page.waitForTimeout(1000);

        // Wait for the holocard wrapper to be in visible state
        await page.waitForSelector('.holocard-wrapper.visible', { timeout: 5000 });

        const cardContent = page.locator('.holo-card .card-content').first();
        const metrics = await cardContent.evaluate(el => {
            const s = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                overflowX: s.overflowX,
                overflowY: s.overflowY,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left,
                top: rect.top,
                vw: window.innerWidth,
                vh: window.innerHeight
            };
        });

        // Horizontal overflow stays clipped; vertical may scroll for long content
        expect(metrics.overflowX).toBe('hidden');
        expect(['auto', 'hidden', 'scroll']).toContain(metrics.overflowY);
        expect(metrics.left).toBeGreaterThanOrEqual(-1);
        expect(metrics.right).toBeLessThanOrEqual(metrics.vw + 1);
        expect(metrics.top).toBeGreaterThanOrEqual(-1);
        expect(metrics.bottom).toBeLessThanOrEqual(metrics.vh + 1);
    });

    test('URL updates when scrolling to a planet page', async ({ page }) => {
        await page.evaluate(() => document.getElementById('earth-0')?.scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(1000);

        const url = page.url();
        // After scrolling to earth-0, URL should contain planet=earth
        expect(url).toMatch(/planet=earth/);
    });

    test('URL updates when scrolling to a card page', async ({ page }) => {
        await page.evaluate(() => document.getElementById('earth-2')?.scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(1000);

        const url = page.url();
        expect(url).toContain('planet=earth');
        expect(url).toContain('card=2');
    });

    test('first planet page does NOT show holocard wrapper', async ({ page }) => {
        await page.evaluate(() => document.getElementById('earth-0')?.scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(1000);

        // Planet view (card=0) → wrapper must be hidden
        const wrapper = page.locator('.holocard-wrapper');
        await expect(wrapper).not.toHaveClass(/visible/);
    });

    test('card page shows holocard wrapper', async ({ page }) => {
        await page.evaluate(() => document.getElementById('earth-1')?.scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(1500);

        const wrapper = page.locator('.holocard-wrapper');
        await expect(wrapper).toHaveClass(/visible/, { timeout: 3000 });
    });

    test('deep link ?planet=sun&card=1 shows sun card without manual scroll', async ({ page }) => {
        await page.goto('http://localhost:3030/?planet=sun&card=1', { waitUntil: 'domcontentloaded' });
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
        await page.evaluate(() => document.getElementById('earth-1')?.scrollIntoView({ behavior: 'instant' }));
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
