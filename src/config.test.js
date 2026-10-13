import { describe, it, expect } from 'vitest';
import { CONFIG } from './config.js';

const TOUR_PLANETS = ['earth', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'neptune'];

describe('CONFIG realism + perf budgets', () => {
    it('gives every tour planet a texture path', () => {
        for (const id of TOUR_PLANETS) {
            expect(CONFIG.planets[id], id).toBeDefined();
            expect(CONFIG.planets[id].texture, id).toMatch(/^textures\/.+\.(jpg|png)$/);
        }
    });

    it('gives every planet a numeric axial tilt', () => {
        for (const id of Object.keys(CONFIG.planets)) {
            expect(typeof CONFIG.planets[id].axialTilt, id).toBe('number');
        }
    });

    it('matches known real-world tilts', () => {
        expect(CONFIG.planets.venus.axialTilt).toBeCloseTo(177.4, 1);
        expect(CONFIG.planets.uranus.axialTilt).toBeCloseTo(97.8, 1);
        expect(CONFIG.planets.earth.axialTilt).toBeCloseTo(23.4, 1);
        expect(CONFIG.planets.saturn.axialTilt).toBeCloseTo(26.7, 1);
    });

    it('marks only Venus and Uranus retrograde', () => {
        const retro = Object.keys(CONFIG.planets).filter((id) => CONFIG.planets[id].retrograde);
        expect(retro.sort()).toEqual(['uranus', 'venus']);
    });

    it('keeps the perf budgets (stars, segments, pixel ratio, no shadows)', () => {
        expect(CONFIG.stars.count).toBeLessThanOrEqual(2500);
        expect(CONFIG.planetSegments).toBeLessThanOrEqual(32);
        expect(CONFIG.maxPixelRatio).toBeLessThanOrEqual(1.5);
        expect(CONFIG.maxPixelRatioMobile).toBeLessThanOrEqual(1.25);
        expect(CONFIG.enableShadows).toBe(false);
    });
});
