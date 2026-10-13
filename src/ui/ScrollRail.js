/**
 * ScrollRail.js
 * Quiet persistent scroll indicator + jump navigation.
 *
 * Design goals (CADcraft-inspired, but quieter):
 * - 11 stops only: welcome + 9 planets + end. Cards 0-3 show as a tiny
 *   progress fill under the active planet dot, not as extra rows.
 * - Desktop: fixed right rail. Mobile: thin top progress bar.
 * - No extra rAF, no layout thrash: updates only on IntersectionObserver
 *   state change, uses opacity/transform only, no backdrop-filter.
 * - Accessible: real <button>s, aria-labels, aria-current, keyboard focus.
 */

const STOPS = [
    { id: 'welcome', label: 'Launch', target: 'welcome' },
    { id: 'earth', label: 'Earth', target: 'earth-0' },
    { id: 'sun', label: 'Sun', target: 'sun-0' },
    { id: 'moon', label: 'Moon', target: 'moon-0' },
    { id: 'mars', label: 'Mars', target: 'mars-0' },
    { id: 'mercury', label: 'Mercury', target: 'mercury-0' },
    { id: 'jupiter', label: 'Jupiter', target: 'jupiter-0' },
    { id: 'venus', label: 'Venus', target: 'venus-0' },
    { id: 'saturn', label: 'Saturn', target: 'saturn-0' },
    { id: 'neptune', label: 'Neptune', target: 'neptune-0' },
    { id: 'end', label: 'Contact', target: 'end' },
];

const PLANET_INDEX = {
    earth: 1, sun: 2, moon: 3, mars: 4, mercury: 5,
    jupiter: 6, venus: 7, saturn: 8, neptune: 9,
};

export class ScrollRail {
    constructor() {
        this.stops = STOPS;
        this.activeStop = 'welcome';
        this.onNavigate = null;
        this.railEl = null;
        this.progressEl = null;
        this.buttons = new Map();
        this._build();
    }

    _build() {
        // --- Desktop / tablet rail ---
        const nav = document.createElement('nav');
        nav.className = 'scroll-rail';
        nav.setAttribute('aria-label', 'Cosmic timeline');

        const list = document.createElement('ol');
        list.className = 'scroll-rail__list';

        STOPS.forEach((stop, i) => {
            const li = document.createElement('li');
            li.className = 'scroll-rail__item';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'scroll-rail__btn';
            btn.dataset.stop = stop.id;
            btn.setAttribute('aria-label', `Go to ${stop.label}`);
            btn.innerHTML = `
                <span class="scroll-rail__num" aria-hidden="true">${String(i).padStart(2, '0')}</span>
                <span class="scroll-rail__dot" aria-hidden="true">
                    <span class="scroll-rail__fill" aria-hidden="true"></span>
                </span>
                <span class="scroll-rail__label" aria-hidden="true">${stop.label}</span>
            `;

            btn.addEventListener('click', () => {
                const el = document.getElementById(stop.target);
                if (!el) return;
                const reduce = typeof window !== 'undefined' && window.matchMedia &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
                if (this.onNavigate) this.onNavigate(stop.id);
            });

            li.appendChild(btn);
            list.appendChild(li);
            this.buttons.set(stop.id, btn);
        });

        nav.appendChild(list);
        document.body.appendChild(nav);
        this.railEl = nav;

        // --- Mobile top progress bar ---
        const bar = document.createElement('div');
        bar.className = 'scroll-progress-top';
        bar.setAttribute('aria-hidden', 'true');
        bar.innerHTML = '<div class="scroll-progress-top__fill"></div>';
        document.body.appendChild(bar);
        this.progressEl = bar.querySelector('.scroll-progress-top__fill');

        this.setActive('welcome', 0);
    }

    setNavigationCallback(cb) {
        this.onNavigate = cb;
    }

    /**
     * @param {string|null} planet - planet id, or null for welcome/end
     * @param {number} card - 0..3
     * @param {string} rawId - optional explicit stop id ('welcome' | 'end')
     */
    setActive(planet, card = 0, rawId = null) {
        let stopId = rawId;
        if (!stopId) {
            if (!planet) stopId = this.activeStop === 'end' ? 'end' : 'welcome';
            else if (PLANET_INDEX[planet] !== undefined) stopId = planet;
            else stopId = 'welcome';
        }

        // Explicit welcome/end mapping when observer reports no planet
        if (planet === null || planet === undefined) {
            // keep current unless caller passed rawId
            if (!rawId) stopId = this.activeStop;
        }

        this.activeStop = stopId;

        for (const [id, btn] of this.buttons) {
            const isActive = id === stopId;
            btn.classList.toggle('is-active', isActive);
            if (isActive) btn.setAttribute('aria-current', 'true');
            else btn.removeAttribute('aria-current');

            // Card progress fill for planet stops (card 0..3 -> 0..100%)
            const fill = btn.querySelector('.scroll-rail__fill');
            if (fill) {
                if (isActive && PLANET_INDEX[id] !== undefined) {
                    const pct = Math.max(0, Math.min(3, Number(card) || 0)) / 3;
                    fill.style.transform = `scaleX(${pct.toFixed(3)})`;
                } else if (isActive) {
                    fill.style.transform = 'scaleX(1)';
                } else {
                    fill.style.transform = 'scaleX(0)';
                }
            }
        }

        // Top bar: global progress across 11 stops
        if (this.progressEl) {
            const order = STOPS.findIndex((s) => s.id === stopId);
            const total = STOPS.length - 1;
            let frac = order < 0 ? 0 : order / total;
            // Nudge within planet by card progress
            if (PLANET_INDEX[stopId] !== undefined) {
                const cardFrac = (Math.max(0, Math.min(3, Number(card) || 0)) / 3) / total;
                frac += cardFrac * 0.9;
            }
            this.progressEl.style.transform = `scaleX(${Math.max(0, Math.min(1, frac)).toFixed(4)})`;
        }
    }

    /** Explicit welcome / end states (observer has no dataset.planet there). */
    setWelcome() {
        this.setActive(null, 0, 'welcome');
    }

    setEnd() {
        this.setActive(null, 0, 'end');
    }

    destroy() {
        if (this.railEl && this.railEl.parentNode) {
            this.railEl.parentNode.removeChild(this.railEl);
        }
        const bar = document.querySelector('.scroll-progress-top');
        if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
        this.buttons.clear();
    }
}
