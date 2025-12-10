
import { describe, it, expect } from 'vitest';
import { calculateNewDifficulty } from './difficultyLogic';

describe('calculateNewDifficulty', () => {
    describe('Upgrade Logic', () => {
        it('should upgrade L1 -> L2 when Reading >= 80% and Total >= 85%', () => {
            expect(calculateNewDifficulty('L1', { readingAccuracy: 1.0, totalAccuracy: 0.9 })).toBe('L2');
            expect(calculateNewDifficulty('L1', { readingAccuracy: 0.8, totalAccuracy: 0.85 })).toBe('L2');
        });

        it('should upgrade L2 -> L3 when metrics are met', () => {
            expect(calculateNewDifficulty('L2', { readingAccuracy: 0.8, totalAccuracy: 0.85 })).toBe('L3');
        });

        it('should stay at L3 (max) even if metrics match', () => {
            expect(calculateNewDifficulty('L3', { readingAccuracy: 1.0, totalAccuracy: 1.0 })).toBe('L3');
        });

        it('should NOT upgrade if Total Accuracy is below 85%', () => {
            // Reading perfect, but total dragged down by vocab
            expect(calculateNewDifficulty('L1', { readingAccuracy: 1.0, totalAccuracy: 0.84 })).toBe('L1');
        });

        it('should NOT upgrade if Reading Accuracy is below 80%', () => {
            // Total high, but reading low (unlikely but possible heavily weighted vocab)
            expect(calculateNewDifficulty('L1', { readingAccuracy: 0.75, totalAccuracy: 0.9 })).toBe('L1');
        });
    });

    describe('Downgrade Logic', () => {
        it('should downgrade L2 -> L1 if Reading Accuracy < 50%', () => {
            // Reading failed, even if total is okayish
            expect(calculateNewDifficulty('L2', { readingAccuracy: 0.25, totalAccuracy: 0.7 })).toBe('L1');
        });

        it('should downgrade L3 -> L2 if Total Accuracy < 60%', () => {
            // Reading perfect, but vocab disaster
            expect(calculateNewDifficulty('L3', { readingAccuracy: 1.0, totalAccuracy: 0.5 })).toBe('L2');
        });

        it('should stay at L1 (min) even if failing', () => {
            expect(calculateNewDifficulty('L1', { readingAccuracy: 0.0, totalAccuracy: 0.0 })).toBe('L1');
        });
    });

    describe('Keep Logic (Learning Zone)', () => {
        it('should maintain level when in learning zone', () => {
            // Reading 75% (Comfortable but not perfect)
            // Total 70% (Good challenge)
            expect(calculateNewDifficulty('L2', { readingAccuracy: 0.75, totalAccuracy: 0.7 })).toBe('L2');
        });
        it('should maintain level when high reading but mid total', () => {
            expect(calculateNewDifficulty('L2', { readingAccuracy: 1.0, totalAccuracy: 0.80 })).toBe('L2');
        });
    });
});
