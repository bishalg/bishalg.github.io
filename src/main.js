/**
 * main.js
 * Entry point for the Cosmic CV
 */
import { CosmicScene } from './core/CosmicScene.js';
import { ScrollAnimator } from './core/ScrollAnimator.js';
import { Holocard } from './ui/Holocard.js';
import { solarSystemData } from './data/solarSystemData.js';
import * as THREE from 'three';
import gsap from 'gsap';
import Lenis from '@studio-freight/lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Make globals available if needed by legacy scripts (though we should avoid this)
window.THREE = THREE;
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;

class App {
    constructor() {
        this.init();
    }

    init() {
        THREE.DefaultLoadingManager.onLoad = () => {
            const loader = document.getElementById('loader');
            if (loader) {
                loader.classList.add('loader--hidden');
                setTimeout(() => loader.remove(), 800);
            }
            this.start();
        };

        // Initialize Components
        this.cosmicScene = new CosmicScene();
        this.holocard = new Holocard();

        // Initialize Scroll Animator with Holocard for sequential reveals
        this.scrollAnimator = new ScrollAnimator(
            this.cosmicScene,
            this.holocard,
            solarSystemData
        );

        this.smoothScroll = new SmoothScroll();
    }

    start() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.cosmicScene.render();
        };
        animate();
    }
}

class SmoothScroll {
    constructor() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            smooth: true
        });

        this.lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => this.lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    if (window.WebGLRenderingContext) {
        window.cosmicApp = new App();
    }
});