// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScrollRail } from './ScrollRail.js';

function addTarget(id) {
    const el = document.createElement('section');
    el.id = id;
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);
    return el;
}

describe('ScrollRail', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        addTarget('welcome');
        addTarget('earth-0');
        addTarget('mars-0');
        addTarget('end');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('builds eleven stops plus a mobile progress bar', () => {
        const rail = new ScrollRail();
        const buttons = document.querySelectorAll('.scroll-rail__btn');
        expect(buttons).toHaveLength(11);
        expect(document.querySelector('.scroll-progress-top__fill')).not.toBeNull();
        expect(buttons[0].getAttribute('aria-label')).toContain('Launch');
        rail.destroy();
    });

    it('marks the active stop and fills card progress', () => {
        const rail = new ScrollRail();
        rail.setActive('mars', 1);

        const mars = document.querySelector('[data-stop="mars"]');
        const earth = document.querySelector('[data-stop="earth"]');
        expect(mars.classList.contains('is-active')).toBe(true);
        expect(mars.getAttribute('aria-current')).toBe('true');
        expect(earth.classList.contains('is-active')).toBe(false);
        expect(earth.hasAttribute('aria-current')).toBe(false);

        const fill = mars.querySelector('.scroll-rail__fill').style.transform;
        expect(fill).toContain('0.333');
        expect(earth.querySelector('.scroll-rail__fill').style.transform).toContain('scaleX(0)');
        rail.destroy();
    });

    it('clamps card progress and handles welcome/end explicitly', () => {
        const rail = new ScrollRail();
        rail.setActive('earth', 99);
        expect(document.querySelector('[data-stop="earth"]').classList.contains('is-active')).toBe(true);

        rail.setWelcome();
        expect(document.querySelector('[data-stop="welcome"]').classList.contains('is-active')).toBe(true);
        rail.setEnd();
        expect(document.querySelector('[data-stop="end"]').classList.contains('is-active')).toBe(true);
        rail.destroy();
    });

    it('clicking a stop scrolls to its target and notifies', () => {
        const rail = new ScrollRail();
        const seen = [];
        rail.setNavigationCallback((id) => seen.push(id));

        document.querySelector('[data-stop="earth"]').click();
        expect(document.getElementById('earth-0').scrollIntoView).toHaveBeenCalled();
        expect(seen).toEqual(['earth']);
        rail.destroy();
    });

    it('advances the top progress bar and keeps state on null planet', () => {
        const rail = new ScrollRail();
        rail.setActive('earth', 0);
        const bar = document.querySelector('.scroll-progress-top__fill');
        const before = bar.style.transform;
        rail.setActive('earth', 3);
        expect(bar.style.transform).not.toBe(before);

        rail.setActive(null, 0);
        expect(document.querySelector('[data-stop="earth"]').classList.contains('is-active')).toBe(true);
        rail.destroy();
    });

    it('destroy removes the rail and progress bar', () => {
        const rail = new ScrollRail();
        rail.destroy();
        expect(document.querySelector('.scroll-rail')).toBeNull();
        expect(document.querySelector('.scroll-progress-top')).toBeNull();
        expect(() => rail.destroy()).not.toThrow(); // idempotent
    });

    it('honours reduced motion and unknown stops quietly', () => {
        const rail = new ScrollRail();
        globalThis.window.matchMedia = () => ({ matches: true });
        document.querySelector('[data-stop="mars"]').click();
        expect(document.getElementById('mars-0').scrollIntoView)
            .toHaveBeenCalledWith({ behavior: 'auto' });
        delete globalThis.window.matchMedia;

        rail.setActive(null, 0, 'nope'); // unknown stop: nothing active, bar at zero
        expect(document.querySelectorAll('.scroll-rail__btn.is-active')).toHaveLength(0);

        rail.progressEl = null; // missing bar: still silent
        expect(() => rail.setActive('mars', 2)).not.toThrow();
        rail.destroy();
    });
});
