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
        it('should have 36 total states', () => {
            expect(machine.getTotal()).toBe(36);
        });

        it('should start at index 0', () => {
            expect(machine.getState().index).toBe(0);
        });

        it('should start at earth, card 0', () => {
            const state = machine.getState();
            expect(state.planet).toBe('earth');
            expect(state.card).toBe(0);
        });

        it('should have correct state at index 4 (sun, card 0)', () => {
            const state = machine.getStateAt(4);
            expect(state.planet).toBe('sun');
            expect(state.card).toBe(0);
        });

        it('should have correct state at index 35 (neptune, card 3)', () => {
            const state = machine.getStateAt(35);
            expect(state.planet).toBe('neptune');
            expect(state.card).toBe(3);
        });
    });

    describe('next()', () => {
        it('should move to next state', () => {
            const newState = machine.next();
            expect(newState.index).toBe(1);
            expect(newState.planet).toBe('earth');
            expect(newState.card).toBe(1);
        });

        it('should move through all 4 cards of earth', () => {
            machine.next(); // 1
            machine.next(); // 2
            machine.next(); // 3
            const state = machine.getState();
            expect(state.index).toBe(3);
            expect(state.planet).toBe('earth');
            expect(state.card).toBe(3);
        });

        it('should transition to next planet after 4 nexts', () => {
            machine.next(); // 1
            machine.next(); // 2
            machine.next(); // 3
            const sunState = machine.next(); // 4 = sun, card 0
            expect(sunState.planet).toBe('sun');
            expect(sunState.card).toBe(0);
        });

        it('should return null at end (index 35)', () => {
            machine.goTo(35); // Go to last state
            const result = machine.next();
            expect(result).toBeNull();
            expect(machine.getState().index).toBe(35); // Stays at 35
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
            machine.goTo(4); // sun, card 0
            const earthState = machine.prev(); // 3 = earth, card 3
            expect(earthState.planet).toBe('earth');
            expect(earthState.card).toBe(3);
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

        it('should clamp to 35 for index > 35', () => {
            const state = machine.goTo(100);
            expect(state.index).toBe(35);
        });
    });

    describe('goToPlanetCard()', () => {
        it('should jump to mars card 2', () => {
            const state = machine.goToPlanetCard('mars', 2);
            expect(state.planet).toBe('mars');
            expect(state.card).toBe(2);
            expect(state.index).toBe(14); // mars is 4th planet (index 3), 3*4 + 2 = 14
        });

        it('should return null for invalid planet', () => {
            const result = machine.goToPlanetCard('pluto', 0);
            expect(result).toBeNull();
        });

        it('should clamp card to valid range', () => {
            const state = machine.goToPlanetCard('earth', 99);
            expect(state.card).toBe(3); // Clamped to max
        });
    });

    describe('getIndexFor()', () => {
        it('should return correct index for jupiter card 1', () => {
            const index = machine.getIndexFor('jupiter', 1);
            // jupiter is 6th planet (index 5), 5*4 + 1 = 21
            expect(index).toBe(21);
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
            machine.goTo(20);
            machine.reset();
            expect(machine.getState().index).toBe(0);
        });
    });
});
