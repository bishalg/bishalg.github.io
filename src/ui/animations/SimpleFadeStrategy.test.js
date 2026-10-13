import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AnimationStrategy } from './AnimationStrategy.js';
import { SimpleFadeStrategy } from './SimpleFadeStrategy.js';

class Concrete extends AnimationStrategy {
    enter() {}
    update() {}
    exit() {}
}

const fakeCard = () => ({ style: {} });

describe('AnimationStrategy', () => {
    it('refuses direct instantiation', () => {
        expect(() => new AnimationStrategy()).toThrow();
    });

    it('exposes the enter/update/exit interface on subclasses', () => {
        const s = new Concrete();
        expect(() => s.enter()).not.toThrow();
        expect(() => s.update()).not.toThrow();
        expect(() => s.exit()).not.toThrow();
    });

    it('throws on every unimplemented base method', () => {
        const bare = Object.create(AnimationStrategy.prototype);
        expect(() => bare.enter()).toThrow();
        expect(() => bare.update()).toThrow();
        expect(() => bare.exit()).toThrow();
    });
});

describe('SimpleFadeStrategy', () => {
    let savedWindow;

    beforeEach(() => {
        savedWindow = globalThis.window;
    });

    afterEach(() => {
        if (savedWindow === undefined) delete globalThis.window;
        else globalThis.window = savedWindow;
    });

    function noMotionStub(matches) {
        globalThis.window = {
            matchMedia: () => ({ matches }),
        };
    }

    it('hides all cards instantly without GSAP (CDN-failure path)', () => {
        delete globalThis.window;
        const strategy = new SimpleFadeStrategy();
        const cards = [fakeCard(), fakeCard(), fakeCard()];

        strategy.enter(null, cards);
        for (const card of cards) {
            expect(card.style.opacity).toBe('0');
            expect(card.style.visibility).toBe('hidden');
        }
        expect(cards[0].style.zIndex).toBe('3');

        strategy.update(cards, 2);
        expect(cards[1].style.opacity).toBe('1');
        expect(cards[1].style.visibility).toBe('visible');
        expect(cards[0].style.opacity).toBe('0');

        strategy.update(cards, 0);
        expect(cards[1].style.opacity).toBe('0');

        strategy.exit(cards);
        for (const card of cards) expect(card.style.opacity).toBe('0');
    });

    it('goes instant under prefers-reduced-motion even with GSAP present', () => {
        noMotionStub(true);
        const calls = [];
        globalThis.window.gsap = {
            set: (...args) => calls.push(['set', ...args]),
            to: (...args) => calls.push(['to', ...args]),
        };
        const strategy = new SimpleFadeStrategy();
        const cards = [fakeCard()];

        strategy.enter(null, cards);
        strategy.update(cards, 1);

        expect(calls).toHaveLength(0);
        expect(cards[0].style.opacity).toBe('1');
    });

    it('uses autoAlpha tweens with overwrite when GSAP is available', () => {
        noMotionStub(false);
        const calls = [];
        globalThis.window.gsap = {
            set: (target, vars) => calls.push({ op: 'set', target, vars }),
            to: (target, vars) => calls.push({ op: 'to', target, vars }),
        };
        const strategy = new SimpleFadeStrategy();
        const cards = [fakeCard(), fakeCard()];

        strategy.enter(null, cards);
        expect(calls[0]).toMatchObject({ op: 'set', vars: { autoAlpha: 0, zIndex: 2 } });

        strategy.update(cards, 1);
        const shown = calls.find((c) => c.op === 'to' && c.target === cards[0]);
        const hidden = calls.find((c) => c.op === 'to' && c.target === cards[1]);
        expect(shown.vars).toMatchObject({ autoAlpha: 1, overwrite: true });
        expect(hidden.vars).toMatchObject({ autoAlpha: 0, overwrite: true });

        strategy.exit(cards);
        expect(calls.at(-1).op).toBe('to');
    });
});
