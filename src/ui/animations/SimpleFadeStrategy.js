/**
 * SimpleFadeStrategy.js
 * Implements a simple fade-in/out animation for cards.
 * Uses GSAP autoAlpha (opacity + visibility) rather than manual display toggling
 * to avoid the race condition where onComplete fires after the card was re-shown.
 *
 * Works on desktop and mobile: cards are absolutely stacked overlays; page snap
 * selects the active card — never nest a second scroll stack inside the holocard.
 */
import { AnimationStrategy } from './AnimationStrategy.js';

const gsap = window.gsap;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class SimpleFadeStrategy extends AnimationStrategy {
    constructor() {
        super();
    }

    _durations() {
        if (prefersReducedMotion()) {
            return { enter: 0.01, exit: 0.01 };
        }
        return { enter: 0.35, exit: 0.22 };
    }

    enter(container, cards, data) {
        // Set only autoAlpha/zIndex — do NOT touch x/y/scale/rotation because
        // GSAP writing those properties replaces CSS transform:translate(-50%,-50%)
        // centering with translate3d(0,0,0), breaking card positioning.
        cards.forEach((card, index) => {
            gsap.set(card, { autoAlpha: 0, zIndex: cards.length - index });
        });
    }

    update(cards, activeIndex, progress = 0) {
        if (activeIndex === 0) {
            this.exit(cards);
            return;
        }

        const targetArrayIndex = activeIndex - 1;
        const { enter, exit } = this._durations();

        cards.forEach((card, index) => {
            const isActive = index === targetArrayIndex;
            // Raise the incoming card above siblings so the crossfade never flashes through.
            if (isActive) {
                gsap.set(card, { zIndex: cards.length + 1 });
            }
            // overwrite:true cancels any in-progress tween on this card,
            // preventing the old onComplete from firing after a rapid state change.
            gsap.to(card, {
                autoAlpha: isActive ? 1 : 0,
                duration: isActive ? enter : exit,
                ease: isActive ? 'power2.out' : 'power1.in',
                overwrite: true
            });
        });
    }

    exit(cards) {
        const { exit } = this._durations();
        gsap.to(cards, {
            autoAlpha: 0,
            duration: exit,
            ease: 'power1.in',
            overwrite: true
        });
    }
}
