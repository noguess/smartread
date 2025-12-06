
import { describe, it, expect } from 'vitest';
import { calculateNewDifficulty } from './difficultyLogic';

describe('calculateNewDifficulty', () => {
    describe('Upgrade Logic', () => {
        it('should upgrade from L1 to L2 if score is 4/4 and feedback is easy (<=2)', () => {
            expect(calculateNewDifficulty('L1', 4, 1)).toBe('L2');
            expect(calculateNewDifficulty('L1', 4, 2)).toBe('L2');
        });

        it('should upgrade from L2 to L3 if score is 4/4 and feedback is easy (<=2)', () => {
            expect(calculateNewDifficulty('L2', 4, 2)).toBe('L3');
        });

        it('should NOT upgrade from L3 (already max)', () => {
            expect(calculateNewDifficulty('L3', 4, 1)).toBe('L3');
        });

        it('should NOT upgrade if score is less than 4', () => {
            expect(calculateNewDifficulty('L1', 3, 1)).toBe('L1');
        });

        it('should NOT upgrade if feedback is not easy (>2)', () => {
            expect(calculateNewDifficulty('L1', 4, 3)).toBe('L1');
        });
    });

    describe('Downgrade Logic', () => {
        it('should downgrade from L2 to L1 if score < 2 and feedback is hard (>=4)', () => {
            expect(calculateNewDifficulty('L2', 1, 4)).toBe('L1');
            expect(calculateNewDifficulty('L2', 0, 5)).toBe('L1');
        });

        it('should downgrade from L3 to L2 if score < 2 and feedback is hard (>=4)', () => {
            expect(calculateNewDifficulty('L3', 1, 4)).toBe('L2');
        });

        it('should NOT downgrade from L1 (already min)', () => {
            expect(calculateNewDifficulty('L1', 0, 5)).toBe('L1');
        });

        it('should NOT downgrade if score is >= 2', () => {
            expect(calculateNewDifficulty('L2', 2, 5)).toBe('L2');
        });

        it('should NOT downgrade if feedback is meant to be easy (<4)', () => {
            expect(calculateNewDifficulty('L2', 1, 3)).toBe('L2');
        });
    });
});
