// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScrollAnimator } from './ScrollAnimator.js';

function makeMocks() {
    const cosmicScene = {
        camera: { position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } } },
        cameraTarget: { _v: [0, 0, 0], set(x, y, z) { this._v = [x, y, z]; }, copy(v) { this._v = [v.x, v.y, v.z]; } },
        orbitGroups: {
            earth: { getWorldPosition(v) { v.set(10, 0, 20); return v; } },
        },
        setSimulationSpeed: vi.fn(),
    };
    const holocard = {
        currentPlanet: null,
        prepareContent: vi.fn(function (data) { this.currentPlanet = data.id; }),
        showSpecificCard: vi.fn(),
        hide: vi.fn(),
        destroy: vi.fn(),
    };
    const solarSystemData = { earth: { id: 'earth', title: 'Foundation' } };
    return { cosmicScene, holocard, solarSystemData };
}

function buildDom() {
    document.body.innerHTML = `
        <main id="scroll-container">
            <section class="page" id="welcome"></section>
            <section class="page" id="earth-0" data-planet="earth" data-card="0"></section>
            <section class="page" id="earth-1" data-planet="earth" data-card="1"></section>
            <section class="page" id="end"></section>
        </main>`;
    document.querySelectorAll('.page').forEach((p) => { p.scrollIntoView = vi.fn(); });
}

// jsdom has no IntersectionObserver — capture instances and fire manually.
let observed = [];
let ioCallback = null;
class FakeIO {
    constructor(cb) { ioCallback = cb; this.targets = []; observed.push(this); }
    observe(el) { this.targets.push(el); }
    disconnect() { this.targets = []; }
}
function fire(page, planet, card) {
    ioCallback([{ isIntersecting: true, target: page }]);
}

describe('ScrollAnimator', () => {
    beforeEach(() => {
        buildDom();
        observed = [];
        ioCallback = null;
        globalThis.IntersectionObserver = FakeIO;
        delete globalThis.window.gsap;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        delete globalThis.IntersectionObserver;
    });

    function makeAnimator() {
        const mocks = makeMocks();
        const animator = new ScrollAnimator(mocks.cosmicScene, mocks.holocard, mocks.solarSystemData);
        return { animator, ...mocks };
    }

    it('updates visuals, URL and state when a card page becomes visible', () => {
        const { animator, holocard } = makeAnimator();
        const urls = [];
        const states = [];
        animator.setUrlUpdateCallback((s) => urls.push(s));
        animator.setOnStateChange((s) => states.push(s));

        fire(document.getElementById('earth-1'), 'earth', 1);

        expect(holocard.prepareContent).toHaveBeenCalledTimes(1);
        expect(holocard.showSpecificCard).toHaveBeenCalledWith(1, 0);
        expect(urls).toEqual([{ planet: 'earth', card: 1 }]);
        expect(states).toEqual([{ planet: 'earth', card: 1, pageId: 'earth-1' }]);
        animator.destroy();
    });

    it('does not refire for the same page (NaN-safe dedup)', () => {
        const { animator, holocard } = makeAnimator();
        const page = document.getElementById('earth-1');
        fire(page, 'earth', 1);
        fire(page, 'earth', 1);
        expect(holocard.prepareContent).toHaveBeenCalledTimes(1);
        animator.destroy();
    });

    it('treats welcome and end as distinct states and clears the URL', () => {
        const { animator, holocard } = makeAnimator();
        const urls = [];
        const states = [];
        animator.setUrlUpdateCallback((s) => urls.push(s));
        animator.setOnStateChange((s) => states.push(s));

        fire(document.getElementById('welcome'));
        fire(document.getElementById('end'));

        expect(holocard.hide).toHaveBeenCalled();
        expect(urls).toEqual([null, null]);
        expect(states.map((s) => s.pageId)).toEqual(['welcome', 'end']);
        animator.destroy();
    });

    it('moves the camera without GSAP and follows the target in tick()', () => {
        const { animator, cosmicScene } = makeAnimator();
        fire(document.getElementById('earth-0'), 'earth', 0);
        // direct-set path: planet(10,0,20) + offset(12,4,12)
        expect(cosmicScene.camera.position.x).toBe(22);
        expect(cosmicScene.camera.position.y).toBe(4);

        animator.tick();
        expect(cosmicScene.cameraTarget._v).toEqual([10, 0, 20]);
        animator.destroy();
    });

    it('navigates next/prev by cached page order, including welcome', () => {
        const { animator } = makeAnimator();
        animator.currentPageId = 'welcome';
        animator.goToNextState();
        expect(document.getElementById('earth-0').scrollIntoView).toHaveBeenCalled();

        animator.currentPageId = 'earth-0';
        animator.goToPrevState();
        expect(document.getElementById('welcome').scrollIntoView).toHaveBeenCalled();
        animator.destroy();
    });

    it('jumps to a planet card and returns to god view cleanly', () => {
        const { animator, cosmicScene, holocard } = makeAnimator();
        animator.goToPlanetCard('earth', 1);
        expect(document.getElementById('earth-1').scrollIntoView).toHaveBeenCalled();

        animator.goToPlanetCard('pluto', 1); // unknown target: silent no-op
        animator.currentTarget = 'earth';
        animator.returnToGodView();
        expect(animator.currentTarget).toBeNull();
        expect(holocard.hide).toHaveBeenCalled();
        expect(cosmicScene.setSimulationSpeed).toHaveBeenCalledWith(0.5);
        animator.destroy();
    });

    it('debounces same-planet refocus and drives GSAP when present', () => {
        const { animator, cosmicScene } = makeAnimator();
        const toCalls = [];
        globalThis.window.gsap = { to: (t, v) => toCalls.push(v) };

        animator.focusOnPlanet('earth', { x: 12, y: 4, z: 12 });
        animator.focusOnPlanet('earth', { x: 12, y: 4, z: 12 }); // <150ms: skipped
        expect(toCalls).toHaveLength(1);
        expect(toCalls[0]).toMatchObject({ duration: 0.6, overwrite: true });
        expect(animator.currentTarget).toBe('earth');

        delete globalThis.window.gsap;
        animator.destroy();
    });

    it('warns on unknown planets and no-ops at list boundaries', () => {
        const { animator, holocard } = makeAnimator();
        const warned = [];
        const origWarn = console.warn;
        console.warn = (m) => warned.push(m);
        animator.updateVisualsForState('pluto', 1);
        console.warn = origWarn;
        expect(warned.length).toBe(1);
        expect(holocard.prepareContent).not.toHaveBeenCalled();

        animator.currentPageId = 'end'; // last page: next is a no-op
        animator.goToNextState();
        animator.currentPageId = 'welcome'; // first page: prev is a no-op
        animator.tick(); // no target yet: silent
        animator.goToPrevState();
        expect(document.getElementById('end').scrollIntoView).not.toHaveBeenCalled();
        animator.destroy();
    });

    it('covers scroll helpers, fallbacks and bare destroy', () => {
        const { animator, cosmicScene } = makeAnimator();

        animator._smoothScrollTo(null); // guarded no-op
        expect(animator.getPlanetWorldPosition('pluto')).toMatchObject({ x: 0, y: 0, z: 0 });

        // Reduced motion uses instant scrolling.
        globalThis.window.matchMedia = () => ({ matches: true });
        animator.goToPlanetCard('earth', 0);
        expect(document.getElementById('earth-0').scrollIntoView)
            .toHaveBeenCalledWith({ behavior: 'auto' });
        delete globalThis.window.matchMedia;

        // Planet/card fallback when no page id is tracked yet.
        animator.currentPageId = null;
        animator.currentPlanet = 'earth';
        animator.currentCard = 0;
        animator.goToNextState();
        expect(document.getElementById('earth-1').scrollIntoView).toHaveBeenCalled();
        animator.currentCard = 1;
        animator.goToPrevState();
        expect(document.getElementById('earth-0').scrollIntoView).toHaveBeenCalledTimes(2);

        // GSAP god-view path.
        const toCalls = [];
        globalThis.window.gsap = { to: (t, v) => toCalls.push(v) };
        animator.currentTarget = 'earth';
        animator.returnToGodView();
        expect(toCalls).toHaveLength(2);
        delete globalThis.window.gsap;

        // Bare destroy without observer or holocard.
        animator.observer = null;
        animator.holocard = {};
        expect(() => animator.destroy()).not.toThrow();
    });

    it('disconnects the observer on destroy', () => {
        const { animator } = makeAnimator();
        expect(observed[0].targets.length).toBeGreaterThan(0);
        animator.destroy();
        expect(observed[0].targets).toHaveLength(0);
    });
});
