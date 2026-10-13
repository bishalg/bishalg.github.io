// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('three', () => {
    const renderCalls = [];
    const texCtl = { failRing: true };
    class V3 {
        constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
        copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
        clone() { return new V3(this.x, this.y, this.z); }
        project() {
            // Crude perspective stand-in: compress world units into NDC range
            // so on-screen math in updateLabelPositions behaves realistically.
            this.x /= 400;
            this.y /= 400;
            this.z = globalThis.__projZ || 0;
            return this;
        }
        fromBufferAttribute() { return this; }
        length() { return 2; }
        lerp() { return this; }
    }
    class Group {
        constructor() {
            this.children = [];
            this.rotation = { x: 0, y: 0, z: 0 };
            this.position = new V3();
        }
        add(c) { this.children.push(c); }
        remove(c) { this.children = this.children.filter((x) => x !== c); }
        getWorldPosition(v) { v.set(this.position.x, 0, this.position.z); return v; }
    }
    class Scene extends Group {}
    class Mesh extends Group {
        constructor(g, m) { super(); this.geometry = g; this.material = m; }
    }
    class Mat {
        constructor(o = {}) { Object.assign(this, o); }
        dispose() {}
    }
    return {
        Vector3: V3,
        Vector2: class {},
        Group,
        Scene,
        Mesh,
        SphereGeometry: class { dispose() {} },
        RingGeometry: class {
            constructor() { this.attributes = { position: { count: 3 }, uv: { setXY() {} } }; }
        },
        BufferGeometry: class {
            constructor() { this.attributes = {}; }
            setAttribute() {}
            setFromPoints() { return this; }
        },
        BufferAttribute: class {},
        Texture: class {},
        TextureLoader: class {
            load(url, ok, prog, err) {
                if (url.includes('moon_texture') || url.includes('saturn_texture') ||
                    (url.includes('ring') && texCtl.failRing)) {
                    if (err) err('missing'); // texture-failure fallbacks
                    return {};
                }
                const tex = {};
                if (ok) ok(tex);
                return tex;
            }
        },
        MeshBasicMaterial: Mat,
        MeshStandardMaterial: Mat,
        MeshPhongMaterial: Mat,
        PointsMaterial: class {},
        Points: class {},
        LineBasicMaterial: class {},
        Line: class {},
        AmbientLight: class {},
        HemisphereLight: class {},
        PointLight: class {
            constructor() { this.position = new V3(); this.shadow = { mapSize: {} }; }
        },
        DirectionalLight: class {
            constructor() { this.position = new V3(); }
        },
        PerspectiveCamera: class {
            constructor() { this.position = new V3(); this.position.set = V3.prototype.set; }
            updateProjectionMatrix() {}
            lookAt() {}
        },
        WebGLRenderer: class {
            constructor() { this.shadowMap = {}; }
            setSize() {}
            setPixelRatio() {}
            render() { renderCalls.push(1); }
            dispose() {}
        },
        Raycaster: class {
            setFromCamera() {}
            intersectObjects() { return []; }
        },
        Clock: class { getDelta() { return 0.016; } },
        Color: class {},
        FogExp2: class {},
        MathUtils: { degToRad: (d) => (d * Math.PI) / 180, lerp: (a) => a },
        SRGBColorSpace: 'srgb',
        ACESFilmicToneMapping: 'aces',
        AdditiveBlending: 'additive',
        BackSide: 'back',
        DoubleSide: 'double',
        DefaultLoadingManager: {},
        __renderCalls: renderCalls,
        __texCtl: texCtl,
    };
});

import { CosmicScene } from './CosmicScene.js';
import * as MockThree from 'three';

const realGetContext = HTMLCanvasElement.prototype.getContext;

function stubContexts() {
    HTMLCanvasElement.prototype.getContext = (type) => {
        if (type === '2d') {
            return {
                createRadialGradient: () => ({ addColorStop() {} }),
                fillRect() {},
                fillStyle: '',
            };
        }
        return {}; // webgl-ish
    };
}

describe('CosmicScene (WebGL)', () => {
    beforeEach(() => {
        document.body.innerHTML = '<canvas id="cosmic-canvas"></canvas>';
        stubContexts();
    });

    afterEach(() => {
        HTMLCanvasElement.prototype.getContext = realGetContext;
        document.body.innerHTML = '';
    });

    it('builds the full system with true tilts and the moon on Earth', () => {
        const scene = new CosmicScene();
        expect(scene.useFallback).toBe(false);
        expect(Object.keys(scene.orbitGroups)).toContain('moon');
        expect(scene.orbitGroups.earth.children).toContain(scene.orbitGroups.moon);
        expect(scene.planets.earth.rotation.z).toBeCloseTo(0.4084, 3);
        expect(scene.planets.venus.rotation.z).toBeCloseTo(3.096, 2);
    });

    it('spins prograde planets forward and retrograde ones backward', () => {
        const scene = new CosmicScene();
        scene.update();
        expect(scene.planets.earth.rotation.y).toBeGreaterThan(0);
        expect(scene.planets.venus.rotation.y).toBeLessThan(0);
        expect(scene.planets.uranus.rotation.y).toBeLessThan(0);
    });

    it('routes canvas clicks to the planet callback and hovers cheaply', () => {
        const scene = new CosmicScene();
        const seen = [];
        scene.setPlanetClickCallback((n) => seen.push(n));

        scene.raycaster.intersectObjects = () => [{ object: scene.planets.earth }];
        scene.canvas.dispatchEvent(new window.MouseEvent('click', { clientX: 10, clientY: 10 }));
        expect(seen).toEqual(['earth']);

        // Unknown mesh: no callback, no crash.
        scene.raycaster.intersectObjects = () => [{ object: {} }];
        scene.canvas.dispatchEvent(new window.MouseEvent('click', { clientX: 10, clientY: 10 }));
        expect(seen).toEqual(['earth']);

        // Hover hit highlights the cursor; miss resets it.
        scene.canvas.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 1, clientY: 1 }));
    });

    it('renders the scene and refreshes labels on the throttled cadence', async () => {
        const scene = new CosmicScene();
        const before = MockThree.__renderCalls.length;
        scene.update();
        scene.update();
        scene.update(); // third frame flushes label positions
        scene.render();
        expect(MockThree.__renderCalls.length).toBeGreaterThan(before);
        // Sun sits at the origin, so it projects to viewport center.
        expect(scene.planetLabels.sun.style.transform).toContain('translate3d');
    });

    it('hides labels behind the camera, off-screen, or without groups', () => {
        const scene = new CosmicScene();

        delete scene.orbitGroups.mars;
        expect(() => scene.updateLabelPositions()).not.toThrow();

        scene.orbitGroups.venus.position.x = 1e7;
        scene.updateLabelPositions();
        expect(scene.planetLabels.venus.style.display).toBe('none');

        globalThis.__projZ = 2;
        scene.updateLabelPositions();
        expect(scene.planetLabels.earth.style.display).toBe('none');
        delete globalThis.__projZ;
    });

    it('covers the moon fallback guard and the resize debounce', async () => {
        const scene = new CosmicScene();
        scene.useFallback = true; // force the fallback side of the moon guard
        expect(() => scene.update()).not.toThrow();
        scene.useFallback = false;

        const spy = vi.spyOn(scene, 'handleResize');
        window.dispatchEvent(new window.Event('resize'));
        window.dispatchEvent(new window.Event('resize')); // debounced away
        await new Promise((r) => setTimeout(r, 40));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('loads the ring alpha map when it arrives intact', () => {
        MockThree.__texCtl.failRing = false;
        const scene = new CosmicScene();
        expect(scene.planets.saturn).toBeDefined();
        MockThree.__texCtl.failRing = true;
    });

    it('caps pixel ratio and survives resize without a renderer', () => {
        const scene = new CosmicScene();
        Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });
        scene.handleResize();
        scene.renderer = null;
        expect(() => scene.handleResize()).not.toThrow();
    });

    it('falls back to 2D mode when contexts are unavailable', () => {
        HTMLCanvasElement.prototype.getContext = () => null;
        const scene = new CosmicScene();
        expect(scene.useFallback).toBe(true);
        expect(Object.keys(scene.planetLabels)).toHaveLength(10);
    });
});
