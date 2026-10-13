import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * PlanetPreview — tiny live 3D planet inside the card circle.
 *
 * Rewritten for perf + correctness (previous version created a second
 * full-size renderer per mount, measured a hidden container as 0x0, and
 * attached window touch/mouse listeners that fought page scroll):
 * - ONE shared renderer, fixed 220px backing store (110 CSS px), reused
 *   across all planets. No per-mount context, no layout measurement.
 * - Real axial tilt per planet (Venus 177.4° upside-down, Uranus 97.8°
 *   on its side) + retrograde spin sign for Venus / Uranus.
 * - No drag interaction: display-only, so mobile scroll never fights it.
 * - Renders only while the stats card is the active card; paused otherwise.
 * - Reduced-motion: single static frame, no loop.
 * - WebGL failure: returns false, caller keeps the <img> fallback.
 */

const PREVIEW_SIZE = 220;
const SPIN_SCALE = 4; // card spin is scaled up so motion reads in 110px

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class PlanetPreview {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.tiltGroup = null;
        this.planetMesh = null;
        this.geometry = null;
        this.textureLoader = null;
        this.textureCache = new Map();
        this.animationId = null;
        this.ready = false;
        this.failed = false;
        this.currentPlanetId = null;
        this.spin = 0.008;
        this.isRunning = false;
    }

    /** Lazily create the shared renderer. False when WebGL unavailable. */
    ensureReady() {
        if (this.ready) return true;
        if (this.failed) return false;
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                this.failed = true;
                return false;
            }

            this.scene = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
            this.camera.position.z = 5;

            const isMobile = window.innerWidth < 768;
            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: !isMobile,
                powerPreference: isMobile ? 'low-power' : 'high-performance',
            });
            this.renderer.setPixelRatio(1);
            this.renderer.setSize(PREVIEW_SIZE, PREVIEW_SIZE, false);
            this.renderer.domElement.className = 'stats-planet-canvas';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;

            const ambient = new THREE.AmbientLight(0xffffff, 1.0);
            this.scene.add(ambient);
            // Key light mostly frontal (toward the card viewer) so the
            // visible face reads bright and true-colored; the slight
            // offset keeps a soft limb falloff instead of a flat look.
            // The old side light (4, 1.5, 2.5) left half the face black,
            // which read as a dark overlay in the tiny circle.
            const dir = new THREE.DirectionalLight(0xffffff, 2.0);
            dir.position.set(2.5, 1.2, 5);
            this.scene.add(dir);

            this.geometry = new THREE.SphereGeometry(1.5, 32, 32);
            this.textureLoader = new THREE.TextureLoader();
            this.ready = true;
            return true;
        } catch (error) {
            this.failed = true;
            return false;
        }
    }

    loadTexture(planetId, url) {
        if (this.textureCache.has(planetId)) {
            return this.textureCache.get(planetId);
        }
        const tex = this.textureLoader.load(
            url,
            () => {
                // Repaint once the async texture arrives (loop may be mid-run).
                if (this.isRunning && this.renderer && this.planetMesh) {
                    this.renderer.render(this.scene, this.camera);
                }
            },
            undefined,
            () => { /* keep flat color on failure */ }
        );
        tex.colorSpace = THREE.SRGBColorSpace;
        this.textureCache.set(planetId, tex);
        return tex;
    }

    /**
     * Mount (or re-target) the shared canvas into a stats sphere element.
     * Returns false when WebGL is unavailable so the caller keeps <img>.
     */
    mount(container, planetId) {
        if (!container || !planetId) return false;
        if (!this.ensureReady()) return false;

        const config = CONFIG.planets[planetId];
        if (!config) return false;

        // Clear previous planet objects, keep cached textures.
        if (this.tiltGroup) {
            this.scene.remove(this.tiltGroup);
            if (this.planetMesh) {
                this.planetMesh.material.dispose();
                this.planetMesh = null;
            }
            this.tiltGroup = null;
        }

        this.tiltGroup = new THREE.Group();
        // True axial tilt (deg → rad). Venus 177.4° renders upside-down,
        // Uranus 97.8° rolls on its side — same as the real planets.
        const tiltDeg = typeof config.axialTilt === 'number' ? config.axialTilt : 15;
        this.tiltGroup.rotation.z = THREE.MathUtils.degToRad(tiltDeg);

        let material;
        // White base when a texture is present so the map shows its true
        // colors. Tinting (map * dark config color, e.g. Neptune navy)
        // rendered every card planet muddy/dark.
        const baseColor = config.texture ? 0xffffff : new THREE.Color(config.color);
        if (planetId === 'sun') {
            material = new THREE.MeshBasicMaterial({
                color: baseColor,
            });
            if (config.texture) {
                material.map = this.loadTexture(planetId, config.texture);
            }
        } else {
            material = new THREE.MeshStandardMaterial({
                color: baseColor,
                roughness: 0.85,
                metalness: 0.05,
            });
            if (config.texture) {
                material.map = this.loadTexture(planetId, config.texture);
            }
        }

        this.planetMesh = new THREE.Mesh(this.geometry, material);
        this.tiltGroup.add(this.planetMesh);

        if (planetId === 'saturn' && config.hasRing) {
            this.tiltGroup.add(this.createRing());
        }

        this.scene.add(this.tiltGroup);

        // Spin sign carries the retrograde motion: Venus + Uranus go backwards.
        const dir = config.retrograde ? -1 : 1;
        this.spin = (config.rotationSpeed || 0.002) * SPIN_SCALE * dir;
        this.currentPlanetId = planetId;

        if (!container.contains(this.renderer.domElement)) {
            container.appendChild(this.renderer.domElement);
        }
        // 3D is live: hide the <img> fallback so the texture map behind
        // the transparent canvas can't ghost through as a double image.
        // The <img> stays (hidden) so no-WebGL still shows it; spheres are
        // rebuilt per card, so the class dies with the element.
        container.classList.add('has-3d');

        // One immediate frame so the circle is never empty, then loop.
        this.renderer.render(this.scene, this.camera);
        if (!prefersReducedMotion()) {
            this.start();
        } else {
            this.stop();
        }
        return true;
    }

    createRing() {
        const ringGeo = new THREE.RingGeometry(2.0, 3.2, 48);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xcfb596,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
        });
        if (CONFIG.planets.saturn.ringTexture) {
            const tex = this.loadTexture('saturn-ring', CONFIG.planets.saturn.ringTexture);
            ringMat.map = tex;
            ringMat.alphaMap = tex;
        }
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.4;
        return ring;
    }

    start() {
        if (this.isRunning || !this.ready || prefersReducedMotion()) return;
        this.isRunning = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        const animate = () => {
            if (!this.isRunning) return;
            if (!document.hidden && this.planetMesh) {
                this.planetMesh.rotation.y += this.spin;
                if (this.renderer) {
                    this.renderer.render(this.scene, this.camera);
                }
            }
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    dispose() {
        this.stop();
        if (this.geometry) {
            this.geometry.dispose();
            this.geometry = null;
        }
        for (const tex of this.textureCache.values()) {
            tex.dispose();
        }
        this.textureCache.clear();
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
        }
        this.ready = false;
        this.currentPlanetId = null;
    }
}
