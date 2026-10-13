import { describe, it, expect } from 'vitest';
import {
    createPanelHeader,
    createStatGrid,
    createPersonalNarrative,
    createProfessionalContent,
} from './HUDComponents.js';

const earthLike = {
    id: 'mars',
    title: 'Technical Skills',
    subtitle: 'Engineering & Development',
    accentColor: '#FF4444',
    stats: [
        { label: 'Languages', value: '8+ Programming' },
        { label: 'Platforms', value: 'Multi-platform' },
    ],
    narrative: 'First sentence here. Second sentence there. Third one too.',
    quote: 'Short quote.',
    professional: {
        title: 'Full Stack Engineering',
        summary: 'Complete proficiency. Extra detail follows here.',
        skills: ['a', 'b', 'c', 'd', 'e'],
    },
};

describe('HUDComponents', () => {
    describe('createPanelHeader', () => {
        it('renders system id uppercased with title and subtitle', () => {
            const html = createPanelHeader(earthLike);
            expect(html).toContain('SYSTEM: MARS');
            expect(html).toContain('Technical Skills');
            expect(html).toContain('Engineering');
        });

        it('tolerates missing data', () => {
            expect(createPanelHeader(null)).not.toContain('SYSTEM:');
            expect(createPanelHeader({})).not.toContain('<h2');
        });
    });

    describe('createStatGrid', () => {
        it('embeds the planet texture with lazy loading and a planet id hook', () => {
            const html = createStatGrid(earthLike);
            expect(html).toContain('data-planet-id="mars"');
            expect(html).toContain('textures/mars_texture_2k_small.jpg');
            expect(html).toContain('loading="lazy"');
            expect(html).toContain('Languages');
            expect(html).toContain('8+ Programming');
        });

        it('falls back gracefully for unknown planet ids', () => {
            const html = createStatGrid({ id: 'pluto', stats: [] });
            expect(html).toContain('data-planet-id="pluto"');
            expect(html).not.toContain('<img');
        });

        it('escapes attribute- and markup-breaking characters', () => {
            const html = createStatGrid({ id: 'mars', title: 'A"B<C', stats: [] });
            expect(html).not.toContain('A"B<C');
            expect(html).toContain('A"B&lt;C');
        });
    });

    describe('createPersonalNarrative', () => {
        it('keeps only the first sentence plus quote', () => {
            const html = createPersonalNarrative(earthLike);
            expect(html).toContain('First sentence here.');
            expect(html).not.toContain('Second sentence');
            expect(html).toContain('Short quote.');
        });

        it('truncates long quotes', () => {
            const html = createPersonalNarrative({ narrative: 'One.', quote: 'x'.repeat(200) });
            expect(html).toContain('...');
            expect(html.length).toBeLessThan(600);
        });
    });

    describe('createProfessionalContent', () => {
        it('returns empty string without professional data', () => {
            expect(createProfessionalContent(null)).toBe('');
            expect(createProfessionalContent(undefined)).toBe('');
        });

        it('caps skills at four and keeps the first summary sentence', () => {
            const html = createProfessionalContent(earthLike.professional);
            expect(html).toContain('Full Stack Engineering');
            expect(html).toContain('Complete proficiency.');
            expect(html).not.toContain('Extra detail');
            expect(html).not.toContain('>e<');
        });

        it('tolerates sparse professional records', () => {
            const html = createProfessionalContent({});
            expect(html).toContain('professional-card-layout');
            expect(html).not.toContain('prof-role');
            expect(html).not.toContain('skill-tags');
        });
    });

    describe('empty states', () => {
        it('renders an empty stat grid and silent narratives', () => {
            const grid = createStatGrid({});
            expect(grid).not.toContain('<img');
            expect(grid).toContain('stat-grid');

            const narrative = createPersonalNarrative({});
            expect(narrative).toContain('personal-card-layout');
            expect(narrative).not.toContain('<p');
            expect(narrative).not.toContain('blockquote');
        });
    });
});
