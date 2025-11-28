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
    }

    it('should handle correct answer for new word', () => {
        const result = SRSAlgorithm.calculateNextReview(baseWord, true)

        expect(result.interval).toBe(1)
        expect(result.status).toBe('Review')
        expect(result.repetitionCount).toBe(1)
        // Next review should be in future
        expect(result.nextReviewAt).toBeGreaterThan(Date.now())
    })

    it('should increase interval for correct answer (1 -> 3)', () => {
        const word: Word = { ...baseWord, interval: 1, status: 'Review' }
        const result = SRSAlgorithm.calculateNextReview(word, true)

        expect(result.interval).toBe(3)
        expect(result.status).toBe('Review')
    })

    it('should reset interval for incorrect answer', () => {
        const word: Word = { ...baseWord, interval: 10, status: 'Review' }
        const result = SRSAlgorithm.calculateNextReview(word, false)

        expect(result.interval).toBe(1)
        expect(result.status).toBe('Learning')
        // Next review should be roughly tomorrow (allow small delta)
        const tomorrow = Date.now() + 24 * 60 * 60 * 1000
        expect(result.nextReviewAt).toBeLessThanOrEqual(tomorrow + 1000)
        expect(result.nextReviewAt).toBeGreaterThan(tomorrow - 1000)
    })

    it('should master word after long interval', () => {
        const word: Word = { ...baseWord, interval: 30, status: 'Review' }
        const result = SRSAlgorithm.calculateNextReview(word, true)

        // 30 * 2.2 = 66 > 60
        expect(result.interval).toBeGreaterThan(60)
        expect(result.status).toBe('Mastered')
    })
})
