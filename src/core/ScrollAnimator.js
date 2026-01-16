import { CONFIG } from '../config.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { ScrollStateMachine } from './ScrollStateMachine.js';

/**
 * ScrollAnimator - Simplified with State Machine
 * 
 * Architecture:
 * - ScrollStateMachine owns navigation state (36 states)
 * - This class handles GSAP/DOM visualization
 * - "Next" button calls stateMachine.next(), then scrolls to that state
 */
export class ScrollAnimator {
    constructor(cosmicScene, holocard, solarSystemData) {
        this.cosmicScene = cosmicScene;
        this.holocard = holocard;
        this.solarSystemData = solarSystemData;
        this.currentTarget = null;
        this.animationFrameId = null;
        this.urlUpdateCallback = null;
        this.isNavigating = false; // Navigation lock flag

        // State Machine (source of truth for navigation)
        this.stateMachine = new ScrollStateMachine();

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

        this.init();
    }

    init() {
        gsap.registerPlugin(ScrollTrigger);
        this.setupScrollTriggers();
        this.startTrackingLoop();

        // Listen to state machine changes
        this.stateMachine.setOnStateChange((state) => {
            if (state) {
                console.log(`[${new Date().toISOString()}] 🎯 State changed to: ${state.planet} card ${state.card} (index ${state.index})`);
                this.updateVisualsForState(state);
                this.updateUrl(state);
            } else {
                // State is null -> God View
                console.log(`[${new Date().toISOString()}] 🏠 State changed to: God View (Start)`);
                this.returnToGodView();
                // Clear URL via callback
                if (this.urlUpdateCallback) this.urlUpdateCallback(null, null);
            }
        });
    }

    /**
     * Navigate to next state (called by Next button)
     */
    goToNextState() {
        const newState = this.stateMachine.next();
        if (newState) {
            console.log(`[${new Date().toISOString()}] ➡️ Next: Going to ${newState.planet} card ${newState.card}`);
            this.scrollToState(newState);
        } else {
            console.log(`[${new Date().toISOString()}] 🛑 Already at last state`);
        }
    }

    /**
     * Navigate to previous state
     */
    goToPrevState() {
        // prev() can now return null (God View)
        const newState = this.stateMachine.prev();
        if (newState) {
            this.scrollToState(newState);
        } else if (this.stateMachine.currentIndex === -1) {
            // Explicitly returned to start
            this.returnToGodView();
        }
    }

    /**
     * Jump to specific planet/card
     */
    goToPlanetCard(planet, card) {
        const state = this.stateMachine.goToPlanetCard(planet, card);
        if (state) {
            this.scrollToState(state);
        }
    }

    /**
     * Calculate scroll position for a state and scroll there
     * Uses PURE LAYOUT MATH - no DOM offsets (unreliable with GSAP pinning)
     * 
     * Layout:
     * - Hero: 0 to 1vh
     * - Earth (planet 0): 1vh to 4vh (3vh pinned)
     * - Sun (planet 1): 4vh to 7vh (3vh pinned)
     * - Moon (planet 2): 7vh to 10vh (3vh pinned)
     * - etc.
     * 
     * Each planet has 4 cards at 0%, 33%, 66%, 99% of its 3vh range
     */
    scrollToState(state) {
        const vh = window.innerHeight;
        const heroHeight = vh; // Hero section is 1 viewport height
        const pinLength = vh * 3; // Each planet is pinned for 3vh (300%)

        const planetIndex = this.stateMachine.planets.indexOf(state.planet);
        const progressPerCard = 0.33;
        const cardProgress = state.card * progressPerCard;

        // Pure calculation: hero + (planet sections before) + (progress within this planet)
        const targetScroll = heroHeight + (planetIndex * pinLength) + (cardProgress * pinLength);

        console.log(`[${new Date().toISOString()}] 🔒 Navigating to ${state.planet} card ${state.card} | scroll: ${Math.round(targetScroll)}px`);

        this.isNavigating = true;

        const onComplete = () => {
            this.isNavigating = false;
            console.log(`[${new Date().toISOString()}] 🔓 Navigation complete`);
        };

        // Use Lenis if available, otherwise fallback
        if (window.cosmicApp?.smoothScroll?.lenis) {
            window.cosmicApp.smoothScroll.lenis.scrollTo(targetScroll, {
                duration: 1.0,
                onComplete: onComplete
            });
        } else {
            window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            setTimeout(onComplete, 1000);
        }
    }

    /**
     * Update visuals (Holocard, camera) for current state
     */
    updateVisualsForState(state) {
        if (!state) return;
        const { planet, card } = state;
        const data = this.solarSystemData[planet];
        const offset = this.planetOffsets[planet];

        if (!data) {
            console.warn(`No data for planet: ${planet}`);
            return;
        }

        // Focus camera on planet (Slows down simulation for stability)
        this.focusOnPlanet(planet, offset);

        // Prepare content if new planet
        if (this.holocard.currentPlanet !== planet) {
            this.holocard.prepareContent(data);
        }

        // Set visible panel count to match card number
        // card 0 = 0 panels, card 1 = 1 panel, etc.
        // But our UI shows Card 1 for card=1, so visiblePanelCount = card
        const targetPanels = card;

        // Adjust panels
        while (this.holocard.visiblePanelCount < targetPanels) {
            this.holocard.showNextPanel();
        }
        while (this.holocard.visiblePanelCount > targetPanels) {
            this.holocard.hideLastPanel();
        }
    }

    /**
     * Update URL with current state
     */
    updateUrl(state) {
        if (this.urlUpdateCallback && state) {
            this.urlUpdateCallback(state.planet, state.card);
        }
    }

    // ========== GSAP/Camera Methods ==========

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
        // Don't reset if we're in the middle of programmatic navigation
        if (this.isNavigating) {
            console.log(`[${new Date().toISOString()}] 🚫 Skipping returnToGodView (isNavigating)`);
            return;
        }

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
        this.stateMachine.reset(); // Will set index to -1
        this.holocard.hide();

        // Scroll back to top
        if (window.cosmicApp?.smoothScroll?.lenis) {
            window.cosmicApp.smoothScroll.lenis.scrollTo(0, { duration: 1.5 });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    startTrackingLoop() {
        const track = () => {
            if (this.currentTarget) {
                const targetPos = this.getPlanetWorldPosition(this.currentTarget);
                // Direct copy instead of lerp - camera always looks at planet's CURRENT position
                // This prevents "chasing" on orbiting planets
                this.cosmicScene.cameraTarget.copy(targetPos);
            }
            this.animationFrameId = requestAnimationFrame(track);
        };
        track();
    }

    /**
     * Setup scroll triggers - simplified to sync with state machine
     */
    setupScrollTriggers() {
        // Hero section - REMOVED for now to avoid interference with Next button navigation
        // Can be added back after Next button works 100%

        // Planet sections - ONLY pinning, NO state sync (state machine is sole driver)
        const planets = this.stateMachine.planets;
        planets.forEach((planetId) => {
            ScrollTrigger.create({
                trigger: `.scene--${planetId}`,
                start: 'top top',
                end: '+=300%',
                pin: true,
                pinSpacing: true
                // NO onUpdate - State Machine is the ONLY source of truth
                // This eliminates all "fighting" between scroll position and state
            });
        });

        // Contact section
        ScrollTrigger.create({
            trigger: '.scene--contact',
            start: 'top 80%',
            onEnter: () => {
                this.holocard.hide();
                gsap.from('.contact-frame', {
                    opacity: 0, y: 50, duration: 1, ease: 'power2.out'
                });
            }
        });

        // Hero animation
        gsap.from('.hud-frame--hero', {
            opacity: 0, y: 30, duration: 1.5, delay: 0.5, ease: 'power3.out'
        });

        console.log('✅ State Machine ScrollTriggers setup complete');
    }

    setUrlUpdateCallback(callback) {
        this.urlUpdateCallback = callback;
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
}
