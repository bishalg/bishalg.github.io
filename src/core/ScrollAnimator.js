import { CONFIG } from '../config.js';
import * as THREE from 'three';

// GSAP is loaded globally (for camera animations only)
const gsap = window.gsap;

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
        this.urlUpdateCallback = null;
        this.animationFrameId = null;

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

        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.startTrackingLoop();
        console.log('🚀 ScrollAnimator initialized with IntersectionObserver');
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
                    const planet = page.dataset.planet;
                    const card = parseInt(page.dataset.card, 10);

                    // Only update if state changed
                    if (this.currentPlanet !== planet || this.currentCard !== card) {
                        console.log(`📍 Page visible: ${planet}-${card}`);
                        this.currentPlanet = planet;
                        this.currentCard = card;

                        this.updateVisualsForState(planet, card);
                        this.updateUrl(planet, card);
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
    goToNextState() {
        const allPages = Array.from(document.querySelectorAll('.page'));
        const currentIndex = allPages.findIndex(p =>
            p.dataset.planet === this.currentPlanet &&
            parseInt(p.dataset.card, 10) === this.currentCard
        );

        if (currentIndex >= 0 && currentIndex < allPages.length - 1) {
            const nextPage = allPages[currentIndex + 1];
            nextPage.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Navigate to previous state
     */
    goToPrevState() {
        const allPages = Array.from(document.querySelectorAll('.page'));
        const currentIndex = allPages.findIndex(p =>
            p.dataset.planet === this.currentPlanet &&
            parseInt(p.dataset.card, 10) === this.currentCard
        );

        if (currentIndex > 0) {
            const prevPage = allPages[currentIndex - 1];
            prevPage.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Jump to specific planet/card (for URL deep linking)
     */
    goToPlanetCard(planet, card) {
        const targetPage = document.getElementById(`${planet}-${card}`);
        if (targetPage) {
            targetPage.scrollIntoView({ behavior: 'smooth' });
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

    // ========== Camera Methods ==========

    getPlanetWorldPosition(planetName) {
        const group = this.cosmicScene.orbitGroups[planetName];
        if (!group) return new THREE.Vector3(0, 0, 0);
        const pos = new THREE.Vector3();
        group.getWorldPosition(pos);
        return pos;
    }

    focusOnPlanet(planetName, cameraOffset = { x: 15, y: 5, z: 15 }) {
        // Slow down simulation for stable tracking
        this.cosmicScene.setSimulationSpeed(0.05);

        const planetPos = this.getPlanetWorldPosition(planetName);
        const camera = this.cosmicScene.camera;

        gsap.to(camera.position, {
            x: planetPos.x + cameraOffset.x,
            y: cameraOffset.y,
            z: planetPos.z + cameraOffset.z,
            duration: 1.0,
            ease: 'power2.out',
            overwrite: true
        });

        this.currentTarget = planetName;
    }

    returnToGodView() {
        // Speed up simulation for dynamic God View
        this.cosmicScene.setSimulationSpeed(0.5);

        const camera = this.cosmicScene.camera;
        const initialPos = CONFIG.camera.initialPosition;

        gsap.to(camera.position, {
            x: initialPos.x,
            y: initialPos.y,
            z: initialPos.z,
            duration: 1.5,
            ease: 'power2.out',
            overwrite: true
        });

        gsap.to(this.cosmicScene.cameraTarget, {
            x: 0, y: 0, z: 0,
            duration: 1.5,
            ease: 'power2.out'
        });

        this.currentTarget = null;
        this.currentPlanet = null;
        this.currentCard = 0;
        this.holocard.hide();
    }

    startTrackingLoop() {
        const track = () => {
            if (this.currentTarget) {
                const targetPos = this.getPlanetWorldPosition(this.currentTarget);
                this.cosmicScene.cameraTarget.copy(targetPos);
            }
            this.animationFrameId = requestAnimationFrame(track);
        };
        track();
    }

    setUrlUpdateCallback(callback) {
        this.urlUpdateCallback = callback;
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.holocard && this.holocard.destroy) {
            this.holocard.destroy();
        }
    }
}
