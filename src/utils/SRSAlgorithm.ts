import { Word, WordStatus } from '../services/db'

/**
 * SuperMemo 2 (SM-2) Algorithm implementation
 * Grades:
 * 0: Total blackout
 * 1: Incorrect response, but remembered when revealed
 * 2: Incorrect response, but seemed easy to recall
 * 3: Correct response, but with significant difficulty
 * 4: Correct response after a hesitation
 * 5: Perfect response
 */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5

export interface SRSUpdate {
    status: WordStatus
    nextReviewAt: number
    interval: number
    repetitionCount: number
    easinessFactor: number
}

export const SRSAlgorithm = {
    calculateNextReview(word: Word, gradeOrCorrect: Grade | boolean): SRSUpdate {
        const grade = typeof gradeOrCorrect === 'boolean'
            ? SRSAlgorithm.mapBooleanToGrade(gradeOrCorrect)
            : gradeOrCorrect;
        let { repetitionCount, interval, easinessFactor = 2.5 } = word
        let status: WordStatus = word.status

        if (grade >= 3) {
            // Success
            if (repetitionCount === 0) {
                interval = 1
            } else if (repetitionCount === 1) {
                interval = 6
            } else {
                interval = Math.round(interval * easinessFactor)
            }
            repetitionCount++
        } else {
            // Failure
            repetitionCount = 0
            interval = 1
        }

        // Calculate new Easiness Factor
        // EF = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
        easinessFactor = easinessFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
        if (easinessFactor < 1.3) easinessFactor = 1.3

        // Update status
        if (repetitionCount === 0) {
            status = 'Learning'
        } else if (repetitionCount >= 5) {
            status = 'Mastered'
        } else if (repetitionCount >= 2) {
            status = 'Review'
        } else {
            status = 'Learning'
        }

        // Set next review timestamp
        const now = Date.now()
        const oneDayMs = 24 * 60 * 60 * 1000
        const nextReviewAt = now + interval * oneDayMs

        return {
            status,
            nextReviewAt,
            interval,
            repetitionCount,
            easinessFactor
        }
    },

    /**
     * Map a simple boolean result (e.g. from quiz) to a grade
     */
    mapBooleanToGrade(isCorrect: boolean, mode: 'reading' | 'drill' = 'reading'): Grade {
        if (!isCorrect) return 0
        return mode === 'drill' ? 5 : 4
    }
}
