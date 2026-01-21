import { describe, it, expect } from 'vitest'
import { SRSAlgorithm } from '../SRSAlgorithm'
import { Word } from '../../services/db'

describe('SRSAlgorithm', () => {
    const baseWord: Word = {
        id: 1,
        spelling: 'test',
        meaning: 'test',
        status: 'Learning',
        nextReviewAt: 0,
        interval: 0,
        repetitionCount: 0,
        lastSeenAt: 0,
        easinessFactor: 2.5
    }

    it('should handle correct boolean (reading) for new word', () => {
        const result = SRSAlgorithm.calculateNextReview(baseWord, true)

        expect(result.interval).toBe(1)
        expect(result.repetitionCount).toBe(1)
        expect(result.status).toBe('Learning') // 1st rep is learning
    })

    it('should handle Grade 5 (drill perfect) for new word', () => {
        const result = SRSAlgorithm.calculateNextReview(baseWord, 5)

        expect(result.interval).toBe(1)
        expect(result.repetitionCount).toBe(1)
        expect(result.easinessFactor).toBeGreaterThan(2.5) // EF increases for 5
    })

    it('should increase interval to 6 after 2nd rep (SM-2)', () => {
        const word: Word = { ...baseWord, repetitionCount: 1, interval: 1, status: 'Learning' }
        const result = SRSAlgorithm.calculateNextReview(word, 4)

        expect(result.interval).toBe(6)
        expect(result.repetitionCount).toBe(2)
        expect(result.status).toBe('Review')
    })

    it('should grow interval by EF after 3rd rep', () => {
        const word: Word = { ...baseWord, repetitionCount: 2, interval: 6, status: 'Review', easinessFactor: 2.5 }
        const result = SRSAlgorithm.calculateNextReview(word, 4)

        expect(result.interval).toBe(15) // 6 * 2.5 = 15
        expect(result.repetitionCount).toBe(3)
    })

    it('should reset interval on failure (boolean false)', () => {
        const word: Word = { ...baseWord, interval: 10, repetitionCount: 3, status: 'Review' }
        const result = SRSAlgorithm.calculateNextReview(word, false)

        expect(result.interval).toBe(1)
        expect(result.repetitionCount).toBe(0)
        expect(result.status).toBe('Learning')
    })

    it('should decrease EF for difficult words (Grade 3)', () => {
        const word: Word = { ...baseWord, easinessFactor: 2.5 }
        const result = SRSAlgorithm.calculateNextReview(word, 3)
        expect(result.easinessFactor).toBeLessThan(2.5)
    })

    it('should master word after 5 reps', () => {
        const word: Word = { ...baseWord, repetitionCount: 4, interval: 30, status: 'Review' }
        const result = SRSAlgorithm.calculateNextReview(word, 5)

        expect(result.repetitionCount).toBe(5)
        expect(result.status).toBe('Mastered')
    })
})
