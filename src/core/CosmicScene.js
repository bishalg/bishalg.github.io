import { CONFIG } from '../config.js';
import * as THREE from 'three';

export class CosmicScene {
    constructor() {
        this.canvas = document.getElementById('cosmic-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.planets = {};
        this.orbitGroups = {}; // For orbital mechanics
        this.stars = null;
        this.clock = new THREE.Clock();
        this.textureLoader = new THREE.TextureLoader();
        this.loadingManager = THREE.DefaultLoadingManager;

        // Camera target for smooth lookAt
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.currentLookAt = new THREE.Vector3(0, 0, 0);

        // Planet labels (HTML overlays)
        this.planetLabels = {};
        this.labelsContainer = null;

        // Click detection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onPlanetClick = null; // Callback for planet clicks

        // Fallback mode for low-performance environments
        this.useFallback = false;
        this.fallbackPlanets = {};

        // Planet display names (with proper capitalization)
        this.planetDisplayNames = {
            sun: 'Sun',
            mercury: 'Mercury',
            venus: 'Venus',
            earth: 'Earth',
            moon: 'Moon',
            mars: 'Mars',
            jupiter: 'Jupiter',
            saturn: 'Saturn',
            uranus: 'Uranus',
            neptune: 'Neptune'
        };

        // Planet colors for fallback mode
        this.planetColors = {
            sun: '#FFAA00',
            mercury: '#8C7853',
            venus: '#FFC649',
            earth: '#6B93D6',
            moon: '#C0C0C0',
            mars: '#CD5C5C',
            jupiter: '#D8CA9D',
            saturn: '#FAD5A5',
            uranus: '#4FD0E7',
            neptune: '#4B70DD'
        };

        this.simulationSpeed = 0.5; // Default fast speed for God View
        this.init();
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();

        // Only create 3D elements if not in fallback mode
        if (!this.useFallback) {
            this.createStars();
            this.createLighting();
        }

        this.createLabelsContainer();
        this.createSolarSystem();
        this.setupClickHandler();
        this.handleResize();

        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Create container for planet labels
     */
    createLabelsContainer() {
        this.labelsContainer = document.createElement('div');
        this.labelsContainer.className = 'planet-labels-container';
        document.body.appendChild(this.labelsContainer);
    }

    /**
     * Setup click handler for planets
     */
    setupClickHandler() {
        if (this.useFallback) {
            // Fallback mode: add click handlers to CSS planets
            Object.entries(this.fallbackPlanets).forEach(([name, planet]) => {
                planet.style.pointerEvents = 'auto';
                planet.style.cursor = 'pointer';
                planet.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (this.onPlanetClick) {
                        this.onPlanetClick(name);
                    }
                });
            });
        } else {
            // 3D mode: use raycasting
            this.canvas.addEventListener('click', (event) => {
                // Calculate mouse position in normalized device coordinates
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                // Update raycaster
                this.raycaster.setFromCamera(this.mouse, this.camera);

                // Check for intersections with planets
                const planetMeshes = Object.values(this.planets);
                const intersects = this.raycaster.intersectObjects(planetMeshes, false);

                if (intersects.length > 0) {
                    // Find which planet was clicked
                    const clickedMesh = intersects[0].object;
                    for (const [name, mesh] of Object.entries(this.planets)) {
                        if (mesh === clickedMesh && this.onPlanetClick) {
                            this.onPlanetClick(name);
                            break;
                        }
                    }
                }
            });

            // Change cursor on hover
            this.canvas.addEventListener('mousemove', (event) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, this.camera);
                const planetMeshes = Object.values(this.planets);
                const intersects = this.raycaster.intersectObjects(planetMeshes, false);

                this.canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
            });
        }
    }

    /**
     * Set callback for planet clicks
     */
    setPlanetClickCallback(callback) {
        this.onPlanetClick = callback;
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000005);
        this.scene.fog = new THREE.FogExp2(0x000005, 0.0002);
    }

    createCamera() {
        const isMobile = window.innerWidth < 768;
        const fov = isMobile ? CONFIG.camera.fov.mobile : CONFIG.camera.fov.desktop;

        this.camera = new THREE.PerspectiveCamera(
            fov,
            window.innerWidth / window.innerHeight,
            CONFIG.camera.near,
            CONFIG.camera.far
        );

        const pos = CONFIG.camera.initialPosition;
        this.camera.position.set(pos.x, pos.y, pos.z);
        this.camera.lookAt(0, 0, 0);
    }

    createRenderer() {
        // Check if WebGL is available and working
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) {
            this.useFallback = true;
            this.createFallbackPlanets();
            return;
        }

        try {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: false,
                powerPreference: "high-performance"
            });

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            this.renderer.outputColorSpace = THREE.SRGBColorSpace; // r160+
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Test render to ensure WebGL works
            this.renderer.render(this.scene, this.camera);

        } catch (error) {
            this.useFallback = true;
            this.createFallbackPlanets();
        }
    }

    /**
     * Create CSS/HTML fallback planets when WebGL is not available
     */
    createFallbackPlanets() {
        // Create container for fallback planets
        this.fallbackContainer = document.createElement('div');
        this.fallbackContainer.className = 'fallback-planets-container';
        this.fallbackContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: -1;
        `;
        document.body.appendChild(this.fallbackContainer);

        // Create fallback planet elements
        const planetConfigs = [
            { id: 'sun', distance: 0, size: 20 },
            { id: 'mercury', distance: 30, size: 3 },
            { id: 'venus', distance: 45, size: 5 },
            { id: 'earth', distance: 60, size: 5 },
            { id: 'mars', distance: 80, size: 4 },
            { id: 'jupiter', distance: 120, size: 12 },
            { id: 'saturn', distance: 160, size: 10 },
            { id: 'uranus', distance: 200, size: 7 },
            { id: 'neptune', distance: 240, size: 7 }
        ];

        planetConfigs.forEach(config => {
            const planet = document.createElement('div');
            planet.className = `fallback-planet fallback-planet--${config.id}`;
            planet.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: ${config.size}px;
                height: ${config.size}px;
                border-radius: 50%;
                background: ${this.planetColors[config.id]};
                box-shadow: 0 0 ${config.size * 2}px ${this.planetColors[config.id]};
                transform: translate(-50%, -50%) translate(${config.distance}px, 0px);
                opacity: 0.8;
            `;

            // Add glow effect for sun
            if (config.id === 'sun') {
                planet.style.boxShadow = `0 0 ${config.size * 3}px ${this.planetColors[config.id]}, 0 0 ${config.size * 6}px ${this.planetColors[config.id]}40`;
                planet.style.animation = 'fallback-sun-glow 4s ease-in-out infinite alternate';
            }

            this.fallbackContainer.appendChild(planet);
            this.fallbackPlanets[config.id] = planet;
        });

        // Add CSS animation for sun glow
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fallback-sun-glow {
                0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            }
        `;
        document.head.appendChild(style);

        // Add fallback indicator
        const indicator = document.createElement('div');
        indicator.textContent = '2D Mode';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #00f3ff;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-family: 'Courier Prime', monospace;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(indicator);

    }

    createStars() {
        const { count, spread, size } = CONFIG.stars;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Full sphere distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = spread * Math.cbrt(Math.random()); // Even volume distribution

            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = r * Math.cos(phi);

            const colorVariation = 0.6 + Math.random() * 0.4;
            colors[i3] = colorVariation;
            colors[i3 + 1] = colorVariation;
            colors[i3 + 2] = colorVariation + Math.random() * 0.2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: size,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            map: this.createStarTexture(),
            alphaTest: 0.1
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createLighting() {
        // Soft Ambient Light (Base visibility)
        // Increased to 0.6 so the "dark side" is visible, just shadowed
        const ambientLight = new THREE.AmbientLight(0x404050, 0.6);
        this.scene.add(ambientLight);

        // Hemisphere Light (Natural fill - Sky/Ground)
        // Adds subtle variation to shadows so they aren't flat black
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.4);
        this.scene.add(hemiLight);

        // Bright point light at 0,0,0 (The Sun)
        const sunLight = new THREE.PointLight(0xffddaa, 2.5, 0, 0);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;

        // Improve shadow resolution
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.bias = -0.0001;

        this.scene.add(sunLight);

        // Rim light (Backlight for definition - reduced contribution)
        const rimLight = new THREE.DirectionalLight(0x4455ff, 0.3);
        rimLight.position.set(0, 50, 50);
        this.scene.add(rimLight);
    }

    createPlanet(config) {
        const { radius, texture, color, emissive, emissiveIntensity, hasRing } = config;

        // Group to handle position (revolution) vs Mesh (rotation)
        const orbitGroup = new THREE.Group();

        const geometry = new THREE.SphereGeometry(radius, 64, 64);

        let material;
        // Sun uses MeshBasicMaterial to glow (self-illuminated)
        if (config.name === 'sun') {
            material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(color || 0xffffff)
            });
        } else {
            // Planets use MeshStandardMaterial to react to sunlight (Day/Night cycle)
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color || 0xffffff),
                roughness: 0.8, // Dusty/Rock surface feel
                metalness: 0.1
            });
        }

        const mesh = new THREE.Mesh(geometry, material);

        // Enable Shadows for realism
        if (config.name !== 'sun') {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        // Try to load texture asynchronously
        if (texture) {
            this.textureLoader.load(
                texture,
                (loadedTex) => {
                    // Ensure texture encoding is correct for StandardMaterial (r160+)
                    loadedTex.colorSpace = THREE.SRGBColorSpace;
                    material.map = loadedTex;
                    material.needsUpdate = true;
                },
                undefined,
                (err) => {
                    // Texture failed to load - material will use default color
                }
            );
        }

        // Tilt planet axis slightly
        mesh.rotation.z = Math.PI / 12;

        orbitGroup.add(mesh);

        if (hasRing) {
            this.createSaturnRing(mesh, radius);
        }

        // Initial Position calculations
        if (config.name !== 'sun' && config.name !== 'moon') {
            orbitGroup.position.x = Math.cos(config.angle) * config.distance;
            orbitGroup.position.z = Math.sin(config.angle) * config.distance;

            // Add orbit trail with planet color
            this.createOrbitLine(config.distance, color);
        }


        return { mesh, group: orbitGroup };
    }

    /**
     * Create HTML label for a planet
     */
    createPlanetLabel(planetName, radius) {
        const label = document.createElement('div');
        label.className = 'planet-label';
        label.textContent = this.planetDisplayNames[planetName] || planetName;
        label.dataset.planet = planetName;

        // Store original radius for positioning above planet
        label.dataset.radius = radius;

        this.labelsContainer.appendChild(label);
        this.planetLabels[planetName] = label;
    }

    /**
     * Update all planet label positions based on 3D world to screen projection
     */
    updateLabelPositions() {
        if (!this.labelsContainer) return;

        for (const [name, label] of Object.entries(this.planetLabels)) {
            let screenX = 0;
            let screenY = 0;

            if (this.useFallback) {
                // Fallback mode: calculate position from CSS fallback planets
                const fallbackPlanet = this.fallbackPlanets[name];
                if (fallbackPlanet) {
                    const rect = fallbackPlanet.getBoundingClientRect();
                    screenX = rect.left + rect.width / 2;
                    screenY = rect.top - 20; // Position above the planet
                } else {
                    // Default center position if planet not found
                    screenX = window.innerWidth / 2;
                    screenY = window.innerHeight / 2;
                }
            } else {
                // 3D mode: project 3D position to screen
                const group = this.orbitGroups[name];
                if (!group) continue;

                // Get world position of planet
                const worldPos = new THREE.Vector3();
                group.getWorldPosition(worldPos);

                // Add offset above the planet based on radius
                const radius = parseFloat(label.dataset.radius) || 3;
                worldPos.y += radius * 1.5;

                // Project to screen coordinates
                const screenPos = worldPos.clone().project(this.camera);

                // Check if behind camera
                if (screenPos.z > 1) {
                    label.style.display = 'none';
                    continue;
                }

                // Convert to CSS coordinates
                screenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                screenY = (screenPos.y * -0.5 + 0.5) * window.innerHeight;
            }

            // Check if on screen
            if (screenX < -50 || screenX > window.innerWidth + 50 ||
                screenY < -50 || screenY > window.innerHeight + 50) {
                label.style.display = 'none';
                continue;
            }

            label.style.display = 'block';
            label.style.left = `${screenX}px`;
            label.style.top = `${screenY}px`;
        }
    }

    createOrbitLine(radius, color = 0xffffff) {
        const points = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
    }

    createSaturnRing(planetMesh, planetRadius) {
        const ringGeo = new THREE.RingGeometry(planetRadius * 1.4, planetRadius * 2.5, 64);
        const pos = ringGeo.attributes.position;
        const v3 = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v3.fromBufferAttribute(pos, i);
            ringGeo.attributes.uv.setXY(i, v3.length() < planetRadius * 1.8 ? 0 : 1, 1);
        }

        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xcfb596,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        // Load Saturn texture
        this.textureLoader.load(
            'textures/saturn_texture_2k_small.jpg',
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                ringMat.map = tex;
                ringMat.needsUpdate = true;
            },
                undefined,
                (err) => {
                    // Saturn texture failed to load
                }
        );

        // Load ring alpha texture
        if (CONFIG.planets.saturn.ringTexture) {
            this.textureLoader.load(
                CONFIG.planets.saturn.ringTexture,
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    ringMat.alphaMap = tex;
                    ringMat.needsUpdate = true;
                },
                undefined,
                (err) => {
                    // Saturn ring texture failed to load
                }
            );
        }

        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        planetMesh.add(ring);
    }

    createSolarSystem() {
        const p = CONFIG.planets;

        Object.keys(p).forEach(key => {
            if (key === 'moon') return; // Handle moon separately

            const config = p[key];

            // Only create 3D objects if not in fallback mode
            if (!this.useFallback) {
                const result = this.createPlanet(config);
                this.planets[key] = result.mesh;
                this.orbitGroups[key] = result.group;
                this.scene.add(result.group);

                // Extras for Sun/Earth
                if (key === 'sun') this.addSunGlow();
                if (key === 'earth') this.addEarthAtmosphere();
            }

            // Always create labels for click interaction
            this.createPlanetLabel(key, config.radius);
        });

        // Handle Moon (attached to Earth Group)
        const moonConfig = p.moon;
        const moonResult = this.createPlanet(moonConfig);
        this.planets.moon = moonResult.mesh;
        this.orbitGroups.moon = moonResult.group; // This group will orbit Earth Group

        // Create label for moon
        this.createPlanetLabel('moon', moonConfig.radius);

        // Position moon relative to 0,0 (which will be Earth's center in its group)
        moonResult.group.position.set(moonConfig.distance, 0, 0);

        // We add Moon Group to Earth GROUP, so it moves with Earth
        this.orbitGroups.earth.add(moonResult.group);
    }

    addSunGlow() {
        const glowGeo = new THREE.SphereGeometry(CONFIG.planets.sun.radius * 1.2, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        this.planets.sun.add(new THREE.Mesh(glowGeo, glowMat));

        const coronaGeo = new THREE.SphereGeometry(CONFIG.planets.sun.radius * 1.5, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        this.planets.sun.add(new THREE.Mesh(coronaGeo, coronaMat));
    }

    addEarthAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(CONFIG.planets.earth.radius * 1.05, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x4499ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        this.planets.earth.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.fov = width < 768 ? CONFIG.camera.fov.mobile : CONFIG.camera.fov.desktop;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
    }

    update() {
        const delta = this.clock.getDelta();

        // Orbit & Rotation Logic
        Object.keys(CONFIG.planets).forEach(key => {
            const config = CONFIG.planets[key];
            const mesh = this.planets[key];
            const group = this.orbitGroups[key];

            // Update orbital positions for both 3D and fallback modes
            if (key !== 'sun' && key !== 'moon') {
                config.angle += config.speed * this.simulationSpeed;
                const x = Math.cos(config.angle) * config.distance;
                const z = Math.sin(config.angle) * config.distance;

                // 3D mode: update Three.js objects
                if (!this.useFallback && group) {
                    group.position.x = x;
                    group.position.z = z;
                }

                // Fallback mode: update CSS positions
                if (this.useFallback && this.fallbackPlanets[key]) {
                    const planet = this.fallbackPlanets[key];
                    planet.style.transform = `translate(-50%, -50%) translate(${x * 2}px, ${z * 2}px)`;
                }
            }

            // Moon orbit (relative to Earth)
            if (key === 'moon' && group) {
                config.angle += config.speed * this.simulationSpeed;
                const x = Math.cos(config.angle) * config.distance;
                const z = Math.sin(config.angle) * config.distance;

                if (!this.useFallback) {
                    group.position.x = x;
                    group.position.z = z;
                }

                // Note: Moon fallback positioning would be complex, so we'll skip it for now
            }

            // Self Rotation (3D mode only)
            if (!this.useFallback && mesh) {
                mesh.rotation.y += config.rotationSpeed * this.simulationSpeed;
            }
        });

        // Smooth camera follow
        this.currentLookAt.lerp(this.cameraTarget, 0.05);
        this.camera.lookAt(this.currentLookAt);

        // Update planet label positions
        this.updateLabelPositions();
    }

    render() {
        this.update();

        // Only render 3D scene if not in fallback mode
        if (!this.useFallback && this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    setCameraTarget(targetVector) {
        // We clone the vector to avoid reference locking if target is a mesh position directly
        this.cameraTarget.copy(targetVector);
    }

    setSimulationSpeed(speed) {
        this.simulationSpeed = speed;
    }
}
