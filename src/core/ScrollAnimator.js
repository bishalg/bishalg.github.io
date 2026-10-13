import { CONFIG } from '../config.js';
import * as THREE from 'three';

// GSAP is loaded globally (for camera animations only). May be absent if
// CDN fails — camera then snaps instantly instead of breaking navigation.
const getGsap = () => (typeof window !== 'undefined' ? window.gsap : null) || null;
const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * ScrollAnimator - Simplified with IntersectionObserver
 * 
 * Architecture:
 * - Uses CSS scroll-snap for paging (no GSAP pinning)
 * - IntersectionObserver detects which page is visible
 * - Updates URL params and camera focus accordingly
 */
export class ScrollAnimator {
    constructor(cosmicScene, holocard, solarSystemData) {
        this.cosmicScene = cosmicScene;
        this.holocard = holocard;
        this.solarSystemData = solarSystemData;
        this.currentPlanet = null;
        this.currentCard = 0;
        this.currentPageId = null;
        this.urlUpdateCallback = null;
        this.stateChangeCallback = null;

        // Planet camera offsets
        this.planetOffsets = {
            earth: { x: 12, y: 4, z: 12 },
            sun: { x: 0, y: 16, z: 40 },
            moon: { x: 4, y: 2, z: 4 },
            mars: { x: 8, y: 3, z: 8 },
            mercury: { x: 5, y: 2, z: 5 },
            jupiter: { x: 18, y: 6, z: 18 },
            venus: { x: 8, y: 3, z: 8 },
            saturn: { x: 20, y: 8, z: 20 },
            neptune: { x: 15, y: 5, z: 15 }
        };

        this.scrollContainer = document.getElementById('scroll-container');
        this.pages = document.querySelectorAll('.page[data-planet]');
        // Cached page list for next/prev (avoid querySelectorAll per click)
        this._allPages = null;
        // Reused vector for planet lookups — no per-frame allocation
        this._tmpPos = new THREE.Vector3();
        this._lastFocusAt = 0;
        this._lastFocusPlanet = null;

        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        // NOTE: no internal rAF loop anymore. Call tick() from the single
        // app render loop in main.js (two loops caused double rAF overhead).
    }

    /**
     * Per-frame camera-target follow. Called from App's single rAF loop.
     * Kept as a method so main.js owns the only requestAnimationFrame chain.
     */
    tick() {
        if (this.currentTarget) {
            this.getPlanetWorldPosition(this.currentTarget, this._tmpPos);
            this.cosmicScene.cameraTarget.copy(this._tmpPos);
        }
    }

    /**
     * Setup IntersectionObserver to detect visible page
     */
    setupIntersectionObserver() {
        const options = {
            root: this.scrollContainer,
            rootMargin: '0px',
            threshold: 0.6 // Trigger when 60% visible
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const page = entry.target;
                    // Welcome / end pages carry no dataset.planet — normalize
                    // to null/0 instead of undefined/NaN (NaN !== NaN retriggers).
                    const planet = page.dataset.planet || null;
                    const rawCard = parseInt(page.dataset.card, 10);
                    const card = Number.isNaN(rawCard) ? 0 : rawCard;
                    const pageId = page.id || null;

                    // Only update if state changed (include pageId so
                    // welcome(null,0) and end(null,0) are distinct states).
                    if (this.currentPlanet !== planet || this.currentCard !== card || this.currentPageId !== pageId) {
                        this.currentPlanet = planet;
                        this.currentCard = card;
                        this.currentPageId = pageId;

                        this.updateVisualsForState(planet, card);
                        this.updateUrl(planet, card);
                        this.emitStateChange(planet, card, pageId);
                    }
                }
            });
        }, options);

        // Observe all planet/card pages
        this.pages.forEach(page => this.observer.observe(page));

        // Also observe welcome and end pages for URL clearing
        const welcomePage = document.getElementById('welcome');
        const endPage = document.getElementById('end');

        if (welcomePage) {
            this.observer.observe(welcomePage);
        }
        if (endPage) {
            this.observer.observe(endPage);
        }
    }

    /**
     * Navigate to next state
     */
    _cachedPages() {
        if (!this._allPages || this._allPages.length === 0) {
            this._allPages = Array.from(document.querySelectorAll('.page'));
        }
        return this._allPages;
    }

    _smoothScrollTo(el) {
        if (!el) return;
        if (prefersReducedMotion()) {
            el.scrollIntoView({ behavior: 'auto' });
        } else {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }

    goToNextState() {
        const allPages = this._cachedPages();
        let currentIndex;
        if (this.currentPageId) {
            currentIndex = allPages.findIndex((p) => p.id === this.currentPageId);
        } else {
            currentIndex = allPages.findIndex(p =>
                p.dataset.planet === this.currentPlanet &&
                parseInt(p.dataset.card, 10) === this.currentCard
            );
        }

        if (currentIndex >= 0 && currentIndex < allPages.length - 1) {
            const nextPage = allPages[currentIndex + 1];
            this._smoothScrollTo(nextPage);
        }
    }

    /**
     * Navigate to previous state
     */
    goToPrevState() {
        const allPages = this._cachedPages();
        let currentIndex;
        if (this.currentPageId) {
            currentIndex = allPages.findIndex((p) => p.id === this.currentPageId);
        } else {
            currentIndex = allPages.findIndex(p =>
                p.dataset.planet === this.currentPlanet &&
                parseInt(p.dataset.card, 10) === this.currentCard
            );
        }

        if (currentIndex > 0) {
            const prevPage = allPages[currentIndex - 1];
            this._smoothScrollTo(prevPage);
        }
    }

    /**
     * Jump to specific planet/card (for URL deep linking)
     */
    goToPlanetCard(planet, card) {
        const targetPage = document.getElementById(`${planet}-${card}`);
        if (targetPage) {
            this._smoothScrollTo(targetPage);
        }
    }

    /**
     * Update visuals (Holocard, camera) for current state
     */
    updateVisualsForState(planet, card) {
        if (!planet) {
            this.returnToGodView();
            return;
        }

        const data = this.solarSystemData[planet];
        const offset = this.planetOffsets[planet];

        if (!data) {
            console.warn(`No data for planet: ${planet}`);
            return;
        }

        // Focus camera on planet
        this.focusOnPlanet(planet, offset);

        // Prepare content if new planet
        if (this.holocard.currentPlanet !== planet) {
            this.holocard.prepareContent(data);
        }

        // Show the specific card
        this.holocard.showSpecificCard(card, 0);
    }

    /**
     * Update URL with current state
     */
    updateUrl(planet, card) {
        if (this.urlUpdateCallback) {
            if (planet) {
                this.urlUpdateCallback({ planet, card });
            } else {
                this.urlUpdateCallback(null);
            }
        }
    }

    emitStateChange(planet, card, pageId) {
        if (this.stateChangeCallback) {
            this.stateChangeCallback({ planet, card, pageId });
        }
    }

    setOnStateChange(callback) {
        this.stateChangeCallback = callback;
    }

    // ========== Camera Methods ==========

    getPlanetWorldPosition(planetName, target = null) {
        const group = this.cosmicScene.orbitGroups[planetName];
        const out = target || new THREE.Vector3();
        if (!group) return out.set(0, 0, 0);
        group.getWorldPosition(out);
        return out;
    }

    focusOnPlanet(planetName, cameraOffset = { x: 15, y: 5, z: 15 }) {
        // Slow down simulation for stable tracking
        this.cosmicScene.setSimulationSpeed(0.05);

        // Debounce same-planet refocus within 150ms (rapid scroll fires IO repeatedly)
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (planetName === this._lastFocusPlanet && now - this._lastFocusAt < 150) {
            this.currentTarget = planetName;
            return;
        }
        this._lastFocusPlanet = planetName;
        this._lastFocusAt = now;

        this.getPlanetWorldPosition(planetName, this._tmpPos);
        const camera = this.cosmicScene.camera;
        const gsap = getGsap();

        if (!gsap || prefersReducedMotion()) {
            camera.position.set(
                this._tmpPos.x + cameraOffset.x,
                cameraOffset.y,
                this._tmpPos.z + cameraOffset.z
            );
        } else {
            gsap.to(camera.position, {
                x: this._tmpPos.x + cameraOffset.x,
                y: cameraOffset.y,
                z: this._tmpPos.z + cameraOffset.z,
                duration: 0.6,
                ease: 'power2.out',
                overwrite: true
            });
        }

        this.currentTarget = planetName;
    }

    returnToGodView() {
        // Speed up simulation for dynamic God View
        this.cosmicScene.setSimulationSpeed(0.5);

        const camera = this.cosmicScene.camera;
        const initialPos = CONFIG.camera.initialPosition;
        const gsap = getGsap();

        if (!gsap || prefersReducedMotion()) {
            camera.position.set(initialPos.x, initialPos.y, initialPos.z);
            this.cosmicScene.cameraTarget.set(0, 0, 0);
        } else {
            gsap.to(camera.position, {
                x: initialPos.x,
                y: initialPos.y,
                z: initialPos.z,
                duration: 0.9,
                ease: 'power2.out',
                overwrite: true
            });

            gsap.to(this.cosmicScene.cameraTarget, {
                x: 0, y: 0, z: 0,
                duration: 0.9,
                ease: 'power2.out'
            });
        }

        this.currentTarget = null;
        this.currentPlanet = null;
        this.currentCard = 0;
        this.holocard.hide();
    }

    setUrlUpdateCallback(callback) {
        this.urlUpdateCallback = callback;
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.holocard && this.holocard.destroy) {
            this.holocard.destroy();
        }
    }
}
