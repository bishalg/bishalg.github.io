/**
 * ScrollStateMachine.test.js
 * Unit tests for the scroll state machine
 * 
 * Run with: npx vitest run src/core/ScrollStateMachine.test.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScrollStateMachine } from './ScrollStateMachine.js';

describe('ScrollStateMachine', () => {
    let machine;

    beforeEach(() => {
        machine = new ScrollStateMachine();
    });

    describe('Initialization', () => {
        it('should have 27 total states', () => {
            expect(machine.getTotal()).toBe(27);
        });

        it('should start at index 0', () => {
            expect(machine.getState().index).toBe(0);
        });

        it('should start at earth, card 0', () => {
            const state = machine.getState();
            expect(state.planet).toBe('earth');
            expect(state.card).toBe(0);
        });

        it('should have correct state at index 3 (sun, card 0)', () => {
            const state = machine.getStateAt(3);
            expect(state.planet).toBe('sun');
            expect(state.card).toBe(0);
        });

        it('should have correct state at index 26 (neptune, card 2)', () => {
            const state = machine.getStateAt(26);
            expect(state.planet).toBe('neptune');
            expect(state.card).toBe(2);
        });
    });

    describe('next()', () => {
        it('should move to next state', () => {
            const newState = machine.next();
            expect(newState.index).toBe(1);
            expect(newState.planet).toBe('earth');
            expect(newState.card).toBe(1);
        });

        it('should transition to next planet after 3 nexts', () => {
            machine.next(); // 1
            machine.next(); // 2
            const sunState = machine.next(); // 3 = sun, card 0
            expect(sunState.planet).toBe('sun');
            expect(sunState.card).toBe(0);
        });

        it('should return null at end (index 26)', () => {
            machine.goTo(26); // Go to last state
            const result = machine.next();
            expect(result).toBeNull();
            expect(machine.getState().index).toBe(26); // Stays at 26
        });
    });

    describe('prev()', () => {
        it('should move to previous state', () => {
            machine.goTo(5);
            const newState = machine.prev();
            expect(newState.index).toBe(4);
        });

        it('should return null at start (index 0)', () => {
            const result = machine.prev();
            expect(result).toBeNull();
            expect(machine.getState().index).toBe(0); // Stays at 0
        });

        it('should transition to previous planet', () => {
            machine.goTo(3); // sun, card 0
            const earthState = machine.prev(); // 2 = earth, card 2
            expect(earthState.planet).toBe('earth');
            expect(earthState.card).toBe(2);
        });
    });

    describe('goTo()', () => {
        it('should jump to specific index', () => {
            const state = machine.goTo(10);
            expect(state.index).toBe(10);
        });

        it('should clamp to 0 for negative index', () => {
            const state = machine.goTo(-5);
            expect(state.index).toBe(0);
        });

        it('should clamp to 26 for index > 26', () => {
            const state = machine.goTo(100);
            expect(state.index).toBe(26);
        });
    });

    describe('goToPlanetCard()', () => {
        it('should jump to mars card 2', () => {
            const state = machine.goToPlanetCard('mars', 2);
            expect(state.planet).toBe('mars');
            expect(state.card).toBe(2);
            expect(state.index).toBe(11); // mars is 4th planet, earth(3) + sun(3) + moon(3) + mars_index(2) = 11
        });

        it('should return null for invalid planet', () => {
            const result = machine.goToPlanetCard('pluto', 0);
            expect(result).toBeNull();
        });

        it('should clamp card to valid range', () => {
            const state = machine.goToPlanetCard('earth', 99);
            expect(state.card).toBe(2); // Clamped to max (3 cards per planet, so max card index is 2)
        });
    });

    describe('getIndexFor()', () => {
        it('should return correct index for jupiter card 1', () => {
            const index = machine.getIndexFor('jupiter', 1);
            // jupiter is 6th planet, earth(3) + sun(3) + moon(3) + mars(3) + mercury(3) + jupiter_index(1) = 15 + 1 = 16
            expect(index).toBe(16);
        });

        it('should return -1 for invalid planet', () => {
            const index = machine.getIndexFor('pluto', 0);
            expect(index).toBe(-1);
        });
    });

    describe('State change callback', () => {
        it('should call onStateChange when moving next', () => {
            let callCount = 0;
            let lastState = null;
            machine.setOnStateChange((state) => {
                callCount++;
                lastState = state;
            });

            machine.next();
            expect(callCount).toBe(1);
            expect(lastState.index).toBe(1);
        });

        it('should not call onStateChange when goTo same index', () => {
            let callCount = 0;
            machine.setOnStateChange(() => callCount++);

            machine.goTo(0); // Already at 0
            expect(callCount).toBe(0);
        });
    });

    describe('reset()', () => {
        it('should reset to index 0', () => {
            machine.goTo(15);
            machine.reset();
            expect(machine.getState().index).toBe(0);
        });
    });
});
