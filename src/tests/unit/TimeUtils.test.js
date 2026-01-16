import { getCurrentTimestamp, secondsToHMS } from '../../utils/TimeUtils.js';

describe('TimeUtils', () => {
    describe('secondsToHMS', () => {
        test('converts seconds to H:M:S format correctly', () => {
            expect(secondsToHMS(3661)).toBe('1h 1m 1s');
            expect(secondsToHMS(3600)).toBe('1h 0m 0s');
            expect(secondsToHMS(45)).toBe('0h 0m 45s');
        });

        test('handles zero correctly', () => {
            expect(secondsToHMS(0)).toBe('0h 0m 0s');
        });
    });

    describe('getCurrentTimestamp', () => {
        test('returns a string', () => {
            const result = getCurrentTimestamp();
            expect(typeof result).toBe('string');
        });

        test('contains UTC', () => {
            const result = getCurrentTimestamp();
            expect(result).toContain('UTC');
        });
    });
});
