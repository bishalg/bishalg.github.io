// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CosmicScene } from './CosmicScene.js';

describe('CosmicScene (2D fallback)', () => {
    beforeEach(() => {
        document.body.innerHTML = '<canvas id="cosmic-canvas"></canvas>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    function makeScene() {
        const scene = new CosmicScene();
        // Resize listeners accumulate across instances; harmless in tests.
        return scene;
    }

    it('enters fallback mode without WebGL and still labels every planet', () => {
        const scene = makeScene();
        expect(scene.useFallback).toBe(true);
        // 9 tour planets + uranus + moon labels
        expect(Object.keys(scene.planetLabels)).toHaveLength(10);
        expect(scene.planetLabels.earth.textContent).toBe('Earth');
        expect(Object.keys(scene.fallbackPlanets)).toHaveLength(9);
    });

    it('advances fallback orbits and positions labels without throwing', () => {
        const scene = makeScene();
        const before = scene.fallbackPlanets.earth.style.transform;
        scene.update();
        scene.update();
        scene.update(); // labels refresh every 3rd frame
        expect(scene.fallbackPlanets.earth.style.transform).not.toBe(before);
        const label = scene.planetLabels.earth;
        expect(label.style.display).toBe('block');
        expect(label.style.transform).toContain('translate3d');
        expect(() => scene.render()).not.toThrow();
    });

    it('skips the missing moon group instead of crashing (regression)', () => {
        const scene = makeScene();
        expect(scene.orbitGroups.moon).toBeUndefined();
        expect(scene.planetLabels.moon).toBeDefined();
        expect(() => {
            scene.update();
            scene.update();
            scene.update();
        }).not.toThrow();
    });

    it('exposes camera-target and simulation-speed setters', () => {
        const scene = makeScene();
        scene.setSimulationSpeed(0.05);
        expect(scene.simulationSpeed).toBe(0.05);
        scene.setCameraTarget({ x: 1, y: 2, z: 3 });
        expect(scene.cameraTarget.x).toBe(1);
        expect(() => scene.handleResize()).not.toThrow();
    });

    it('forwards fallback planet clicks to the callback', () => {
        const scene = makeScene();
        const seen = [];
        scene.setPlanetClickCallback((name) => seen.push(name));
        scene.fallbackPlanets.mars.click();
        expect(seen).toEqual(['mars']);
    });

    it('ignores fallback clicks with no callback attached', () => {
        const scene = makeScene();
        expect(() => scene.fallbackPlanets.mars.click()).not.toThrow();
    });
});
