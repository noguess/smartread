import { Word, WordStatus } from '../services/db'

// Constants for SRS
const MASTERED_THRESHOLD_DAYS = 60
const INTERVAL_MULTIPLIER_MIN = 1.8
const INTERVAL_MULTIPLIER_MAX = 2.5

export const SRSAlgorithm = {
    /**
     * Calculates the next review date and interval based on user performance.
     * @param word The word being reviewed
     * @param isCorrect Whether the user answered correctly
     * @returns Updated fields for the word
     */
    calculateNextReview(word: Word, isCorrect: boolean): {
        status: WordStatus
        nextReviewAt: number
        interval: number
        repetitionCount: number
    } {
        let { interval, repetitionCount } = word
        let status: WordStatus = word.status
        const now = Date.now()
        const oneDayMs = 24 * 60 * 60 * 1000

        if (isCorrect) {
            // Case A: User Correct
            repetitionCount++

            if (interval === 0) {
                interval = 1
            } else if (interval === 1) {
                interval = 3
            } else {
                // Apply multiplier logic (simplified to ~2x for now)
                interval = Math.ceil(interval * 2.2)
            }

            // Check for Mastered status
            if (interval > MASTERED_THRESHOLD_DAYS) {
                status = 'Mastered'
            } else {
                status = 'Review'
            }
        } else {
            // Case B: User Incorrect
            interval = 1 // Reset to 1 day
            status = 'Learning'
            // Repetition count doesn't necessarily reset, but interval does
        }

        // Calculate next review timestamp
        // If incorrect, review tomorrow (now + 1 day)
        // If correct, review in 'interval' days
        const nextReviewAt = now + interval * oneDayMs

        return {
            status,
            nextReviewAt,
            interval,
            repetitionCount,
        }
    },
}
