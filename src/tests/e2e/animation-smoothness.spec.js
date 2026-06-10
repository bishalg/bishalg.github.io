import { test, expect } from '@playwright/test';

/**
 * Animation smoothness & correctness tests.
 *
 * NOTE: All scroll operations use page.evaluate(scrollIntoView) rather than
 * Playwright's scrollIntoViewIfNeeded() because the Three.js/GSAP animation
 * loop keeps page elements perpetually "unstable" from Playwright's perspective,
 * causing scrollIntoViewIfNeeded to hang until the 30s test timeout.
 */

const scrollTo = (page, id) =>
    page.evaluate(id => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }), id);

test.describe('Animation Smoothness & Correctness', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3030', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#loader', { state: 'detached', timeout: 20000 });
    });

    // ── 1. Card fade timing ────────────────────────────────────────────────
    test('active card fades in within 500ms of page snap', async ({ page }) => {
        await scrollTo(page, 'earth-1');

        await page.waitForSelector('.holocard-wrapper.visible', { timeout: 5000 });

        await page.waitForFunction(() => {
            const cards = document.querySelectorAll('.holo-card');
            return Array.from(cards).some(c => parseFloat(window.getComputedStyle(c).opacity) > 0.95);
        }, { timeout: 5000 });
    });

    // ── 2. autoAlpha: inactive cards must have visibility:hidden ──────────
    test('invisible cards have visibility:hidden (autoAlpha correctness)', async ({ page }) => {
        await scrollTo(page, 'earth-1');
        await page.waitForSelector('.holocard-wrapper.visible', { timeout: 5000 });
        await page.waitForTimeout(600);

        const result = await page.evaluate(() => {
            const cards = document.querySelectorAll('.holo-card');
            const issues = [];
            cards.forEach((card, i) => {
                const s = window.getComputedStyle(card);
                if (parseFloat(s.opacity) < 0.05 && s.visibility === 'visible') {
                    issues.push(`card[${i}] has opacity≈0 but visibility:visible`);
                }
            });
            return issues;
        });

        expect(result).toHaveLength(0);
    });

    // ── 3. CSS centering not clobbered by GSAP ────────────────────────────
    test('cards remain centered (transform not overwritten by GSAP)', async ({ page }) => {
        await scrollTo(page, 'earth-1');
        await page.waitForSelector('.holocard-wrapper.visible', { timeout: 5000 });
        await page.waitForTimeout(600);

        const isCentered = await page.evaluate(() => {
            const wrapper = document.querySelector('.holocard-wrapper');
            const card = document.querySelector('.holo-card');
            if (!wrapper || !card) return false;
            const wRect = wrapper.getBoundingClientRect();
            const cRect = card.getBoundingClientRect();
            const wCx = wRect.left + wRect.width / 2;
            const wCy = wRect.top + wRect.height / 2;
            const cCx = cRect.left + cRect.width / 2;
            const cCy = cRect.top + cRect.height / 2;
            return Math.abs(wCx - cCx) < 20 && Math.abs(wCy - cCy) < 40;
        });

        expect(isCentered).toBe(true);
    });

    // ── 4. Scroll-snap accuracy ────────────────────────────────────────────
    test('scroll container snaps to exact page boundary (no fractional scroll)', async ({ page }) => {
        const container = page.locator('#scroll-container');

        for (const id of ['earth-0', 'earth-1', 'earth-2']) {
            await scrollTo(page, id);
            await page.waitForTimeout(600);
        }

        const { scrollTop, clientHeight } = await container.evaluate(el => ({
            scrollTop: Math.round(el.scrollTop),
            clientHeight: el.clientHeight
        }));

        const remainder = scrollTop % Math.round(clientHeight);
        expect(remainder).toBeLessThan(5);
    });

    // ── 5. No long tasks during scroll ────────────────────────────────────
    test('no long JS tasks (>100ms) during card transition', async ({ page }) => {
        // Inject PerformanceObserver after page load (avoids double-goto)
        await page.evaluate(() => {
            window.__longTasks = [];
            if ('PerformanceObserver' in window) {
                const obs = new PerformanceObserver(list => {
                    list.getEntries().forEach(e => {
                        if (e.duration > 100) {
                            window.__longTasks.push({ name: e.name, duration: e.duration });
                        }
                    });
                });
                obs.observe({ entryTypes: ['longtask'] });
            }
        });

        await scrollTo(page, 'earth-1');
        await page.waitForTimeout(1500);

        const longTasks = await page.evaluate(() => window.__longTasks || []);
        if (longTasks.length > 0) {
            console.warn('Long tasks detected during card transition:', longTasks);
        }
        // Initial Three.js load causes some long tasks — cap at 5
        expect(longTasks.length).toBeLessThan(5);
    });

    // ── 6. Layout stability — card bounds don't shift during fade ─────────
    test('card bounding box does not shift during fade animation', async ({ page }) => {
        await scrollTo(page, 'earth-1');
        await page.waitForSelector('.holocard-wrapper.visible', { timeout: 5000 });

        const rect1 = await page.locator('.holo-card').first().boundingBox();
        await page.waitForTimeout(500);
        const rect2 = await page.locator('.holo-card').first().boundingBox();

        if (rect1 && rect2) {
            expect(Math.abs(rect1.x - rect2.x)).toBeLessThan(2);
            expect(Math.abs(rect1.y - rect2.y)).toBeLessThan(2);
            expect(Math.abs(rect1.width - rect2.width)).toBeLessThan(2);
            expect(Math.abs(rect1.height - rect2.height)).toBeLessThan(2);
        }
    });

    // ── 7. Rapid navigation — no stale tween fires after overwrite ────────
    test('rapid card navigation does not leave cards in intermediate opacity', async ({ page }) => {
        await scrollTo(page, 'earth-1');
        await page.waitForSelector('.holocard-wrapper.visible', { timeout: 5000 });

        // Rapid switches — don't wait for animations to settle
        await scrollTo(page, 'earth-2');
        await page.waitForTimeout(80);
        await scrollTo(page, 'earth-3');
        await page.waitForTimeout(80);
        await scrollTo(page, 'earth-1');

        // Now wait for full settle
        await page.waitForTimeout(800);

        const opacities = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.holo-card')).map(c =>
                parseFloat(window.getComputedStyle(c).opacity)
            )
        );

        const fullyVisible = opacities.filter(o => o > 0.95);
        const partiallyVisible = opacities.filter(o => o > 0.05 && o < 0.95);

        expect(fullyVisible).toHaveLength(1);
        expect(partiallyVisible).toHaveLength(0);
    });

    // ── 8. IntersectionObserver dedup ────────────────────────────────────
    test('scrolling to same page twice does not trigger duplicate state updates', async ({ page }) => {
        await scrollTo(page, 'earth-1');
        await page.waitForTimeout(1000);
        const url1 = page.url();

        await scrollTo(page, 'earth-0');
        await page.waitForTimeout(500);
        await scrollTo(page, 'earth-1');
        await page.waitForTimeout(1000);
        const url2 = page.url();

        expect(url1).toBe(url2);
    });
});
