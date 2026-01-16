import { CONFIG } from '../config.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

export class ScrollAnimator {
    constructor(cosmicScene, onSceneChange) {
        this.scene = cosmicScene;
        this.timeline = null;
        this.onSceneChange = onSceneChange;
        this.init();
    }

    init() {
        gsap.registerPlugin(ScrollTrigger);
        this.createMasterTimeline();
        this.setupSceneTriggers();
    }

    createMasterTimeline() {
        const camera = this.scene.camera;
        const groups = this.scene.orbitGroups;

        const trackTarget = (targetGroup) => {
            const targetPos = new THREE.Vector3();
            targetGroup.getWorldPosition(targetPos);
            this.scene.setCameraTarget(targetPos);
        };

        this.timeline = gsap.timeline({
            scrollTrigger: {
                trigger: '.scroll-container',
                start: 'top top',
                end: 'bottom bottom',
                scrub: CONFIG.scroll.scrub
            }
        });

        // Scene 0: Initial zoom out from Earth
        this.timeline.from(camera.position, {
            x: groups.earth.position.x,
            y: 1,
            z: groups.earth.position.z + 5, // Start close
            duration: 1,
            ease: 'power1.in',
            onUpdate: () => trackTarget(groups.earth)
        });

        // Scene 1: Earth focus
        this.timeline.to(camera.position, {
            x: () => groups.earth.position.x + 15,
            y: 5,
            z: () => groups.earth.position.z + 15,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => trackTarget(groups.earth)
        }, ">");

        // Scene 2: Moon focus
        this.timeline.to(camera.position, {
            x: () => this.scene.orbitGroups.moon.getWorldPosition(new THREE.Vector3()).x + 5,
            y: 2,
            z: () => this.scene.orbitGroups.moon.getWorldPosition(new THREE.Vector3()).z + 5,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                const moonPos = this.scene.orbitGroups.moon.getWorldPosition(new THREE.Vector3());
                this.scene.setCameraTarget(moonPos);
            }
        }, ">");

        // Scene 3: Sun focus
        this.timeline.to(camera.position, {
            x: 0,
            y: 0,
            z: 30, // Close up on the sun
            duration: 2,
            ease: 'power2.inOut',
            onUpdate: () => trackTarget(groups.sun)
        }, ">");
    }

    setupSceneTriggers() {
        const scenes = Object.keys(CONFIG.scroll.scenes);
        scenes.forEach(sceneKey => {
            const sceneConfig = CONFIG.scroll.scenes[sceneKey];
            ScrollTrigger.create({
                trigger: `.scene--${sceneKey}`,
                start: 'top 50%',
                end: 'bottom 50%',
                onEnter: () => this.onSceneChange(sceneKey),
                onEnterBack: () => this.onSceneChange(sceneKey),
                onLeave: () => this.onSceneChange(null),
                onLeaveBack: () => this.onSceneChange(null),
            });
        });
    }
}