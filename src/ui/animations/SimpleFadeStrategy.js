/**
 * SimpleFadeStrategy.js
 * Implements a simple fade-in/out animation for cards.
 * Uses GSAP autoAlpha (opacity + visibility) rather than manual display toggling
 * to avoid the race condition where onComplete fires after the card was re-shown.
 */
import { AnimationStrategy } from './AnimationStrategy.js';

const gsap = window.gsap;

export class SimpleFadeStrategy extends AnimationStrategy {
    constructor() {
        super();
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

        cards.forEach((card, index) => {
            // overwrite:true cancels any in-progress tween on this card,
            // preventing the old onComplete from firing after a rapid state change.
            gsap.to(card, {
                autoAlpha: index === targetArrayIndex ? 1 : 0,
                duration: index === targetArrayIndex ? 0.3 : 0.2,
                overwrite: true
            });
        });
    }

    exit(cards) {
        gsap.to(cards, { autoAlpha: 0, duration: 0.3, overwrite: true });
    }
}
