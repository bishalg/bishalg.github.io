import { test, expect } from '@playwright/test';

/**
 * Core journey tests — verify the fundamental user flow works after
 * the IntersectionObserver + CSS scroll-snap refactor.
 *
 * HTML structure (current):
 *   #scroll-container  (css scroll-snap container)
 *     #welcome          (.page.page--welcome)
 *     #earth-0          (.page.page--planet  data-planet="earth" data-card="0")
 *     #earth-1          (.page.page--card    data-planet="earth" data-card="1")
 *     ...
 *   .holocard-wrapper   (fixed overlay, class "hidden"/"visible")
 *   .holocard-next-btn  (fixed next button)
 */
test.describe('Cosmic CV — Core Journey', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3030', { waitUntil: 'domcontentloaded' });
        // Loader is removed from DOM once all assets finish loading
        await page.waitForSelector('#loader', { state: 'detached', timeout: 20000 });
    });

    test('page has correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/The Architect's Universe/);
    });

    test('hero section is visible on load', async ({ page }) => {
        await expect(page.locator('.hero-title')).toBeVisible();
        await expect(page.locator('.hero-title')).toContainText('BISHAL GHIMIRE');
        await expect(page.locator('#time-travel-btn')).toBeVisible();
    });

    test('time-travel button scrolls to first planet page', async ({ page }) => {
        const scrollContainer = page.locator('#scroll-container');
        const initialScrollTop = await scrollContainer.evaluate(el => el.scrollTop);

        // force:true bypasses Playwright stability check — button has a continuous
        // bounce CSS animation so it never reaches a "stable" state
        await page.locator('#time-travel-btn').click({ force: true });
        await page.waitForTimeout(1500); // allow scroll animation

        const newScrollTop = await scrollContainer.evaluate(el => el.scrollTop);
        expect(newScrollTop).toBeGreaterThan(initialScrollTop);
    });

    test('scroll-snap container exists with correct CSS', async ({ page }) => {
        const container = page.locator('#scroll-container');
        await expect(container).toBeVisible();

        // Verify scroll-snap is applied
        const snapType = await container.evaluate(el =>
            getComputedStyle(el).scrollSnapType
        );
        // Accept any scroll-snap-type that includes 'y mandatory'
        expect(snapType).toMatch(/y mandatory/);
    });

    test('every planet has 4 pages (planet view + 3 cards)', async ({ page }) => {
        const planets = ['earth', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'neptune'];
        for (const planet of planets) {
            for (let card = 0; card <= 3; card++) {
                const pageEl = page.locator(`#${planet}-${card}`);
                await expect(pageEl).toBeAttached();
            }
        }
    });

    test('holocard shows when scrolling to a card page', async ({ page }) => {
        const scrollContainer = page.locator('#scroll-container');

        // Scroll past the earth-0 planet page to earth-1 card page
        await page.evaluate(() => document.getElementById('earth-1')?.scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(1500);

        // Holocard wrapper should become visible
        const wrapper = page.locator('.holocard-wrapper');
        await expect(wrapper).toHaveClass(/visible/, { timeout: 3000 });
    });

    test('URL updates with planet and card params after scroll', async ({ page }) => {
        await page.evaluate(() => document.getElementById('earth-1')?.scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(1500);

        const url = page.url();
        expect(url).toContain('planet=earth');
        expect(url).toContain('card=');
    });

    test('deep link URL restores correct scroll position', async ({ page }) => {
        await page.goto('http://localhost:3030/?planet=mars&card=1', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#loader', { state: 'hidden', timeout: 15000 });
        await page.waitForTimeout(1000);

        // The page #mars-1 should be in view
        const marsCard = page.locator('#mars-1');
        await expect(marsCard).toBeInViewport({ ratio: 0.5 });
    });

    test('next button is visible after scrolling past welcome page', async ({ page }) => {
        const nextBtn = page.locator('.holocard-next-btn');

        // Initially hidden (no card shown on welcome page)
        await page.evaluate(() => document.getElementById('earth-1')?.scrollIntoView({ behavior: 'instant' }));
        await page.waitForTimeout(1500);

        await expect(nextBtn).toBeVisible();
    });
});
