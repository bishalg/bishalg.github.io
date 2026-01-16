import * as THREE from 'three';
import { CONFIG } from '../config.js';
import gsap from 'gsap';

export class PlanetPreview {
    constructor() {
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.planetMesh = null;
        this.planetGroup = null;
        this.animationId = null;
        this.textureLoader = new THREE.TextureLoader();

        // Interaction state
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotationVelocity = 0;
        this.baseRotationSpeed = 0.002;
        this.currentRotationSpeed = 0.002;

        this.init();
    }

    init() {
        // Scene with transparent background
        this.scene = new THREE.Scene();

        // Camera positioned to see the planet clearly
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 3, 5);
        this.scene.add(dirLight);
    }

    mount(container, planetId) {
        if (!container) return;
        this.container = container;

        // Clear previous content
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        // Size renderer to container
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.container.appendChild(this.renderer.domElement);

        // Create planet
        this.createPlanet(planetId);

        // Start animation loop
        this.startLoop();

        // Setup interaction
        this.setupInteraction();
    }

    createPlanet(planetId) {
        // Remove existing planet
        if (this.planetGroup) {
            this.scene.remove(this.planetGroup);
        }

        const config = CONFIG.planets[planetId];
        if (!config) {
            console.warn(`Planet config not found for ${planetId}`);
            return;
        }

        this.baseRotationSpeed = config.rotationSpeed || 0.002;
        this.currentRotationSpeed = this.baseRotationSpeed;

        this.planetGroup = new THREE.Group();

        // Geometry - normal sphere
        // Use a standard size for preview, regardless of actual planet size
        const geometry = new THREE.SphereGeometry(1.5, 64, 64);

        // Material
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(config.color),
            roughness: 0.7,
            metalness: 0.1
        });

        if (config.texture) {
            this.textureLoader.load(config.texture, (tex) => {
                material.map = tex;
                material.needsUpdate = true;
            });
        }

        // Special case for Sun (emissive)
        if (planetId === 'sun') {
            material.emissive = new THREE.Color(config.emissive);
            material.emissiveIntensity = 0.5;
        }

        this.planetMesh = new THREE.Mesh(geometry, material);

        // Add tilt
        this.planetGroup.rotation.z = Math.PI / 12; // 15 degrees tilt
        this.planetGroup.add(this.planetMesh);

        // Add Rings if Saturn
        if (planetId === 'saturn' && config.hasRing) {
            this.createRing(this.planetGroup);
        }

        this.scene.add(this.planetGroup);
    }

    createRing(parent) {
        const ringGeo = new THREE.RingGeometry(2.0, 3.5, 64);
        const pos = ringGeo.attributes.position;
        const v3 = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v3.fromBufferAttribute(pos, i);
            ringGeo.attributes.uv.setXY(i, v3.length() < 2.5 ? 0 : 1, 1);
        }

        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xcfb596,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        if (CONFIG.planets.saturn.ringTexture) {
            this.textureLoader.load(CONFIG.planets.saturn.ringTexture, (tex) => {
                ringMat.map = tex;
                ringMat.alphaMap = tex;
                ringMat.needsUpdate = true;
            });
        }

        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        parent.add(ring);
    }

    startLoop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        const animate = () => {
            if (!this.planetMesh) return;

            // Apply rotation
            if (this.isDragging) {
                this.planetMesh.rotation.y += this.rotationVelocity;
            } else {
                // Lerp back to base speed
                this.currentRotationSpeed = THREE.MathUtils.lerp(this.currentRotationSpeed, this.baseRotationSpeed, 0.05);

                // Add velocity momentum decay
                if (Math.abs(this.rotationVelocity) > 0.0001) {
                    this.rotationVelocity *= 0.95; // Decay
                    this.planetMesh.rotation.y += this.rotationVelocity;
                } else {
                    this.planetMesh.rotation.y += this.currentRotationSpeed;
                }
            }

            this.renderer.render(this.scene, this.camera);
            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    setupInteraction() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            this.onMouseDown(e.touches[0]);
        });
        window.addEventListener('touchmove', (e) => this.onMouseMove(e.touches[0]));
        window.addEventListener('touchend', (e) => this.onMouseUp());
    }

    onMouseDown(e) {
        if (e.target !== this.renderer.domElement) return;
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
        this.rotationVelocity = 0;
        this.container.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.previousMousePosition.x;

        // Rotate based on drag
        this.rotationVelocity = deltaX * 0.005;
        this.planetMesh.rotation.y += this.rotationVelocity;

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
    }

    onMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.container.style.cursor = 'grab';
        }
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    dispose() {
        this.stop();
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.container.contains(this.renderer.domElement)) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
        // Remove event listeners (requires binding reference, but for now simple structure)
    }
}
