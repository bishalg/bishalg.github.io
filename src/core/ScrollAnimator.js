import { CONFIG } from '../config.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

/**
 * ScrollAnimator - Uses pinning to lock each planet view while revealing cards sequentially
 */
export class ScrollAnimator {
    constructor(cosmicScene, holocard, solarSystemData) {
        this.cosmicScene = cosmicScene;
        this.holocard = holocard;
        this.solarSystemData = solarSystemData;
        this.currentTarget = null;
        this.currentPlanet = null;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        gsap.registerPlugin(ScrollTrigger);
        this.setupPinnedSceneTriggers();
        this.startTrackingLoop();
    }

    getPlanetWorldPosition(planetName) {
        const group = this.cosmicScene.orbitGroups[planetName];
        if (!group) return new THREE.Vector3(0, 0, 0);
        const pos = new THREE.Vector3();
        group.getWorldPosition(pos);
        return pos;
    }

    focusOnPlanet(planetName, cameraOffset = { x: 15, y: 5, z: 15 }) {
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
        this.holocard.hide();
    }

    startTrackingLoop() {
        const track = () => {
            if (this.currentTarget) {
                const targetPos = this.getPlanetWorldPosition(this.currentTarget);
                this.cosmicScene.cameraTarget.lerp(targetPos, 0.05);
            }
            this.animationFrameId = requestAnimationFrame(track);
        };
        track();
    }

    /**
     * Setup pinned scroll triggers - each planet section is pinned
     * and user must scroll through to reveal each card panel
     */
    setupPinnedSceneTriggers() {
        // === HERO SECTION (no pin, just camera) ===
        ScrollTrigger.create({
            trigger: '.scene--hero',
            start: 'top top',
            end: 'bottom 20%',
            onEnter: () => this.returnToGodView(),
            onEnterBack: () => this.returnToGodView()
        });

        // Planet configurations
        const planets = [
            { id: 'earth', offset: { x: 12, y: 4, z: 12 } },
            { id: 'sun', offset: { x: 0, y: 16, z: 40 } },
            { id: 'moon', offset: { x: 4, y: 2, z: 4 } },
            { id: 'mars', offset: { x: 8, y: 3, z: 8 } },
            { id: 'mercury', offset: { x: 5, y: 2, z: 5 } },
            { id: 'jupiter', offset: { x: 18, y: 6, z: 18 } },
            { id: 'venus', offset: { x: 8, y: 3, z: 8 } },
            { id: 'saturn', offset: { x: 20, y: 8, z: 20 } },
            { id: 'neptune', offset: { x: 15, y: 5, z: 15 } }
        ];

        planets.forEach(planet => {
            // Create a pinned section that requires scrolling through
            // The section is pinned for 300vh worth of scrolling
            ScrollTrigger.create({
                trigger: `.scene--${planet.id}`,
                start: 'top top',
                end: '+=300%', // Pin for 3x the viewport height
                pin: true,
                pinSpacing: true,
                scrub: 0.5,
                onEnter: () => {
                    console.log(`📍 Pinned: ${planet.id}`);
                    this.currentPlanet = planet.id;
                    this.focusOnPlanet(planet.id, planet.offset);

                    // Prepare card content
                    const data = this.solarSystemData[planet.id];
                    if (data) this.holocard.prepareContent(data);
                },
                onLeave: () => {
                    this.holocard.hide();
                },
                onEnterBack: () => {
                    this.currentPlanet = planet.id;
                    this.focusOnPlanet(planet.id, planet.offset);

                    const data = this.solarSystemData[planet.id];
                    if (data) {
                        this.holocard.prepareContent(data);
                        // Show all panels when coming back
                        this.holocard.showNextPanel();
                        this.holocard.showNextPanel();
                        this.holocard.showNextPanel();
                    }
                },
                onLeaveBack: () => {
                    this.holocard.hide();
                },
                onUpdate: (self) => {
                    // Use scroll progress within pinned section to reveal cards
                    const progress = self.progress;
                    this.updateCardReveal(planet.id, progress);
                }
            });
        });

        // === CONTACT SECTION ===
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

        // Hero title animation
        gsap.from('.hud-frame--hero', {
            opacity: 0, y: 30, duration: 1.5, delay: 0.5, ease: 'power3.out'
        });

        console.log('✅ Pinned scroll triggers setup complete');
    }

    /**
     * Reveal cards based on scroll progress within pinned section
     * 0-25%: Planet only (no cards)
     * 25-50%: Panel 1
     * 50-75%: Panel 2
     * 75-100%: Panel 3
     */
    updateCardReveal(planetId, progress) {
        if (this.currentPlanet !== planetId) return;

        const targetPanelCount = progress < 0.25 ? 0 :
            progress < 0.50 ? 1 :
                progress < 0.75 ? 2 : 3;

        const currentCount = this.holocard.visiblePanelCount;

        // Show panels as we scroll forward
        while (this.holocard.visiblePanelCount < targetPanelCount) {
            this.holocard.showNextPanel();
        }

        // Hide panels as we scroll backward
        while (this.holocard.visiblePanelCount > targetPanelCount) {
            this.holocard.hideLastPanel();
        }
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
}