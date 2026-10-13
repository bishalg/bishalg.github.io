// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Holocard } from './Holocard.js';

const marsData = {
    id: 'mars',
    title: 'Technical Skills',
    subtitle: 'Engineering',
    accentColor: '#FF4444',
    stats: [{ label: 'Languages', value: '8+' }],
    narrative: 'First sentence. Second one.',
    quote: 'A short quote.',
    professional: null,
};

describe('Holocard', () => {
    let card;

    beforeEach(() => {
        document.body.innerHTML = '';
        delete globalThis.window.gsap;
        card = new Holocard();
    });

    afterEach(() => {
        card.destroy();
        document.body.innerHTML = '';
    });

    it('builds a hidden wrapper with three cards on prepare', () => {
        card.prepareContent(marsData);
        expect(document.querySelectorAll('.holo-card')).toHaveLength(3);
        expect(card.wrapper.classList.contains('hidden')).toBe(true);
        expect(card.currentPlanet).toBe('mars');
        expect(card.wrapper.style.getPropertyValue('--accent-color')).toBe('#FF4444');
    });

    it('shows the wrapper on card pages and hides it on planet view', () => {
        card.prepareContent(marsData);
        card.showSpecificCard(1);
        expect(card.wrapper.classList.contains('visible')).toBe(true);
        card.showSpecificCard(0);
        expect(card.wrapper.classList.contains('hidden')).toBe(true);
    });

    it('falls back to the static image when WebGL is unavailable', async () => {
        card.prepareContent(marsData);
        card.showSpecificCard(1);
        // mountPreview defers to rAF; jsdom has no WebGL context.
        await new Promise((r) => setTimeout(r, 80));
        const sphere = document.querySelector('.card-stats .stats-planet-sphere');
        expect(sphere).not.toBeNull();
        expect(sphere.querySelector('img')).not.toBeNull();
        expect(sphere.querySelector('canvas')).toBeNull();
    });

    it('navigates via callback with debounce and clears on hide', async () => {
        const nav = vi.fn();
        card.setNavigationCallback(nav);
        card.prepareContent(marsData);

        card.nextBtn.click();
        expect(nav).toHaveBeenCalledTimes(1);
        expect(card.nextBtn.classList.contains('disabled')).toBe(true);
        card.nextBtn.click(); // debounced away
        expect(nav).toHaveBeenCalledTimes(1);
        await new Promise((r) => setTimeout(r, 450));
        expect(card.nextBtn.classList.contains('disabled')).toBe(false);

        card.showSpecificCard(1);
        card.hide();
        await new Promise((r) => setTimeout(r, 350));
        expect(card.cards).toHaveLength(0);
        expect(card.currentPlanet).toBeNull();
    });

    it('hide() on an empty card is a no-op and destroy cleans up', () => {
        expect(() => card.hide()).not.toThrow();
        card.prepareContent(marsData);
        card.showSpecificCard(1);
        expect(() => card.destroy()).not.toThrow();
        expect(document.querySelector('.holocard-wrapper')).toBeNull();
    });

    it('ignores stale preview mounts after a fast planet switch', async () => {
        card.prepareContent(marsData);
        card.showSpecificCard(1); // queues mount for mars
        card.prepareContent({ ...marsData, id: 'earth', title: 'Foundation' });
        await new Promise((r) => setTimeout(r, 80));
        // No canvas without WebGL, and no crash from the stale frame.
        expect(document.querySelector('canvas.stats-planet-canvas')).toBeNull();
        expect(card.previewPlanetId).toBe('earth');
    });

    it('covers navigation, guards and strategy plumbing', async () => {
        const { SimpleFadeStrategy } = await import('./animations/SimpleFadeStrategy.js');

        // Navigate without a callback: silent no-op.
        expect(() => card.navigateToNextPlanet()).not.toThrow();
        // Null data: prepare is a no-op.
        card.prepareContent(null);
        expect(card.cards).toHaveLength(0);

        // Navigation-state reset path.
        card.isNavigating = true;
        card.nextBtn.classList.add('disabled');
        card.prepareContent(marsData);
        expect(card.isNavigating).toBe(false);
        expect(card.nextBtn.classList.contains('disabled')).toBe(false);

        // Mount guards: no planet id, then no sphere.
        card.previewPlanetId = null;
        card.mountPreview();
        card.previewPlanetId = 'mars';
        card.stackContainer.innerHTML = '';
        card.mountPreview();
        await new Promise((r) => setTimeout(r, 60));

        // Pause an existing preview on non-stats cards, swap strategy.
        card.prepareContent(marsData);
        card.showSpecificCard(1);
        await new Promise((r) => setTimeout(r, 80));
        expect(card.planetPreview).not.toBeNull();
        card.showSpecificCard(2);
        card.showSpecificCard(1); // already visible: no re-toggle
        card.setStrategy(new SimpleFadeStrategy());

        // Backdrop click hides too.
        card.wrapper.querySelector('.holocard-backdrop').click();
        await new Promise((r) => setTimeout(r, 350));
        expect(card.cards).toHaveLength(0);

        // Destroy disposes the preview too.
        card.destroy();
        expect(card.planetPreview).toBeNull();
    });
});
