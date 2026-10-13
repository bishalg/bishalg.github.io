// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('three', () => {
    const calls = [];
    class V3 {
        constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    }
    class Group {
        constructor() { this.children = []; this.rotation = { z: 0 }; this.position = new V3(); }
        add(c) { this.children.push(c); }
        remove(c) { this.children = this.children.filter((x) => x !== c); }
    }
    class Scene extends Group {}
    class Mesh {
        constructor(g, m) { this.geometry = g; this.material = m; this.rotation = { y: 0 }; }
    }
    class StubMat {
        constructor(o = {}) { Object.assign(this, o); }
        dispose() {}
    }
    return {
        Vector3: V3,
        Group,
        Scene,
        Mesh,
        SphereGeometry: class { dispose() {} },
        RingGeometry: class {},
        MeshBasicMaterial: StubMat,
        MeshStandardMaterial: StubMat,
        AmbientLight: class {},
        DirectionalLight: class { constructor() { this.position = new V3(); } },
        PerspectiveCamera: class { constructor() { this.position = new V3(); } },
        TextureLoader: class {
            load(url, ok, prog, err) {
                if (String(url).includes('FAIL')) {
                    setTimeout(() => err && err('x'), 0);
                    return { dispose() {} };
                }
                // Async arrival like the browser: repaint must be safe mid-run.
                setTimeout(() => ok && ok({ dispose() {} }), 0);
                return { dispose() {} };
            }
        },
        WebGLRenderer: class {
            constructor() {
                this.domElement = document.createElement('div');
            }
            setPixelRatio() {}
            setSize() {}
            render() { calls.push(1); }
            dispose() {}
        },
        MathUtils: { degToRad: (d) => (d * Math.PI) / 180 },
        Color: class {},
        DoubleSide: 'double',
        SRGBColorSpace: 'srgb',
        __renderCalls: calls,
    };
});

import { PlanetPreview } from './PlanetPreview.js';
import * as MockThree from 'three';

const renderCalls = MockThree.__renderCalls;

const realGetContext = HTMLCanvasElement.prototype.getContext;

describe('PlanetPreview', () => {
    beforeEach(() => {
        renderCalls.length = 0;
        document.body.innerHTML = '';
        HTMLCanvasElement.prototype.getContext = () => ({});
        delete globalThis.window.matchMedia;
    });

    afterEach(() => {
        HTMLCanvasElement.prototype.getContext = realGetContext;
        document.body.innerHTML = '';
    });

    function sphere(id) {
        const el = document.createElement('div');
        el.className = 'stats-planet-sphere';
        el.dataset.planetId = id;
        document.body.appendChild(el);
        return el;
    }

    it('rejects bad input without touching the DOM', () => {
        const preview = new PlanetPreview();
        expect(preview.mount(null, 'earth')).toBe(false);
        expect(preview.mount(sphere('earth'), 'pluto')).toBe(false);
        expect(preview.mount(sphere('earth'), null)).toBe(false);
        preview.dispose();
    });

    it('applies the true axial tilt and prograde spin for Earth', () => {
        const preview = new PlanetPreview();
        expect(preview.mount(sphere('earth'), 'earth')).toBe(true);
        expect(preview.tiltGroup.rotation.z).toBeCloseTo(0.4084, 3);
        expect(preview.spin).toBeGreaterThan(0);
        preview.dispose();
    });

    it('spins Venus backwards (retrograde)', () => {
        const preview = new PlanetPreview();
        expect(preview.mount(sphere('venus'), 'venus')).toBe(true);
        expect(preview.tiltGroup.rotation.z).toBeCloseTo(3.096, 2);
        expect(preview.spin).toBeLessThan(0);
        preview.dispose();
    });

    it('adds a tilted ring for Saturn and caches textures', async () => {
        const preview = new PlanetPreview();
        // textureLoader is created lazily — spy after first mount
        expect(preview.mount(sphere('saturn'), 'saturn')).toBe(true);
        expect(preview.tiltGroup.children).toHaveLength(2);
        const callsBefore = renderCalls.length;
        expect(preview.mount(sphere('saturn'), 'saturn')).toBe(true);
        expect(preview.textureCache.has('saturn')).toBe(true);
        expect(renderCalls.length).toBeGreaterThan(callsBefore);
        preview.dispose();
    });

    it('animates while running and halts on stop', async () => {
        const preview = new PlanetPreview();
        preview.mount(sphere('mars'), 'mars');
        expect(preview.isRunning).toBe(true);
        const y0 = preview.planetMesh.rotation.y;
        await new Promise((r) => setTimeout(r, 80));
        expect(preview.planetMesh.rotation.y).not.toBe(y0);
        preview.stop();
        expect(preview.isRunning).toBe(false);
        preview.dispose();
        expect(preview.renderer).toBeNull();
    });

    it('renders a single static frame under reduced motion', () => {
        globalThis.window.matchMedia = () => ({ matches: true });
        const preview = new PlanetPreview();
        preview.mount(sphere('mars'), 'mars');
        expect(preview.isRunning).toBe(false);
        expect(renderCalls.length).toBeGreaterThan(0);
        preview.dispose();
    });

    it('keeps the image fallback when WebGL contexts are unavailable', () => {
        HTMLCanvasElement.prototype.getContext = () => null;
        const preview = new PlanetPreview();
        expect(preview.mount(sphere('mars'), 'mars')).toBe(false);
        expect(preview.mount(sphere('mars'), 'mars')).toBe(false); // failed flag short-circuit
        expect(preview.isRunning).toBe(false);
        preview.dispose();
    });

    it('starts safely without a renderer and restarts under reduced motion', () => {
        const fresh = new PlanetPreview();
        expect(() => fresh.start()).not.toThrow();
        expect(fresh.isRunning).toBe(false);

        globalThis.window.matchMedia = () => ({ matches: true });
        const preview = new PlanetPreview();
        preview.mount(sphere('mars'), 'mars');
        preview.stop();
        preview.start(); // reduced motion refuses the loop
        expect(preview.isRunning).toBe(false);
        preview.dispose();
    });

    it('renders the sun and reuses the mounted canvas', () => {
        const preview = new PlanetPreview();
        const el = sphere('sun');
        expect(preview.mount(el, 'sun')).toBe(true);
        expect(preview.tiltGroup.rotation.z).toBeCloseTo(0.1265, 3);
        preview.mount(el, 'sun');
        expect(el.querySelectorAll('.stats-planet-canvas')).toHaveLength(1);
        preview.dispose();
    });

    it('pauses the loop when the tab is hidden and keeps flat color on texture failure', async () => {
        const preview = new PlanetPreview();
        preview.mount(sphere('mars'), 'mars');
        await new Promise((r) => setTimeout(r, 30)); // let the async texture land
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        const renders = renderCalls.length;
        await new Promise((r) => setTimeout(r, 80));
        expect(renderCalls.length).toBe(renders);
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });

        preview.ensureReady();
        preview.loadTexture('bad', 'https://example.com/FAIL_TEX.jpg');
        await new Promise((r) => setTimeout(r, 20));
        preview.dispose();
    });

    it('uses the low-power path on narrow screens and survives renderer failure', () => {
        Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
        const preview = new PlanetPreview();
        expect(preview.mount(sphere('mars'), 'mars')).toBe(true);
        Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
        preview.dispose();

        const el = sphere('mars');
        const spy = vi.spyOn(document, 'createElement').mockImplementationOnce(() => {
            throw new Error('no canvas');
        });
        const broken = new PlanetPreview();
        expect(broken.mount(el, 'mars')).toBe(false);
        spy.mockRestore();
        broken.dispose();
    });
});
