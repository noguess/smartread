import { describe, it, expect } from 'vitest'
import { WordSelector } from '../WordSelector'
import { Word } from '../../services/db'

describe('WordSelector', () => {
    const createWord = (id: number, status: any, nextReviewAt: number): Word => ({
        id,
        spelling: `word${id}`,
        meaning: 'test',
        status,
        nextReviewAt,
        interval: 0,
        repetitionCount: 0,
        lastSeenAt: 0,
    })

    it('should select critical words first', () => {
        const now = Date.now()
        const criticalWords = Array.from({ length: 5 }, (_, i) => createWord(i, 'Review', now - 1000))
        const newWords = Array.from({ length: 5 }, (_, i) => createWord(i + 5, 'New', 0))

        const allWords = [...criticalWords, ...newWords]

        // Request 5 words. Should prioritize critical.
        // Logic: 60% critical = 3, 40% new = 2.
        const selected = WordSelector.selectWordsForArticle(allWords, 5)

        const selectedCritical = selected.filter(w => w.status === 'Review')
        const selectedNew = selected.filter(w => w.status === 'New')

        expect(selected.length).toBe(5)
        expect(selectedCritical.length).toBeGreaterThanOrEqual(3)
        expect(selectedNew.length).toBeLessThanOrEqual(2)
    })

    it('should fill with new words if no critical words', () => {
        const newWords = Array.from({ length: 10 }, (_, i) => createWord(i, 'New', 0))
        const selected = WordSelector.selectWordsForArticle(newWords, 5)

        expect(selected.length).toBe(5)
        expect(selected.every(w => w.status === 'New')).toBe(true)
    })

    it('should fill with mastered words if needed', () => {
        const newWords = Array.from({ length: 2 }, (_, i) => createWord(i, 'New', 0))
        const masteredWords = Array.from({ length: 5 }, (_, i) => createWord(i + 2, 'Mastered', 0))
        const allWords = [...newWords, ...masteredWords]

        const selected = WordSelector.selectWordsForArticle(allWords, 5)

        expect(selected.length).toBe(5)
        expect(selected.filter(w => w.status === 'New').length).toBe(2)
        expect(selected.filter(w => w.status === 'Mastered').length).toBe(3)
    })
})
