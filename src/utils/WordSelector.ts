import { Word } from '../services/db'

export const WordSelector = {
    /**
     * Selects words for article generation based on priority rules.
     * Priority 1: Critical Review (expired review time) ~50-60%
     * Priority 2: New Words ~30-40%
     * Priority 3: Maintenance (Mastered words) filler
     * @param allWords List of all available words
     * @param count Target number of words to select
     */
    selectWordsForArticle(allWords: Word[], count: number): Word[] {
        const now = Date.now()

        // 1. Filter groups
        const criticalReviewWords = allWords.filter(
            (w) => w.status !== 'Mastered' && w.nextReviewAt > 0 && w.nextReviewAt <= now
        )
        const newWords = allWords.filter((w) => w.status === 'New')
        const masteredWords = allWords.filter((w) => w.status === 'Mastered')
        // Also consider 'Learning' words that are not yet due? Or treat them as critical?
        // PRD says Critical Review: status != Mastered && next_review_at <= Now.
        // So 'Learning' words due now are included in criticalReviewWords.

        // 2. Calculate quotas
        const criticalCount = Math.min(Math.round(count * 0.6), criticalReviewWords.length)
        let remainingCount = count - criticalCount

        const newCount = Math.min(Math.round(count * 0.4), newWords.length, remainingCount)
        remainingCount -= newCount

        // 3. Select words
        // Sort critical words by overdue time (most overdue first)? Or random?
        // Let's shuffle for randomness
        const selectedCritical = this.shuffle(criticalReviewWords).slice(0, criticalCount)
        const selectedNew = this.shuffle(newWords).slice(0, newCount)

        let selected = [...selectedCritical, ...selectedNew]

        // 4. Fill with Maintenance (Mastered) or more New/Critical if available
        if (selected.length < count) {
            const needed = count - selected.length

            // Try to fill with Mastered first
            const selectedMastered = this.shuffle(masteredWords).slice(0, needed)
            selected = [...selected, ...selectedMastered]

            // If still not enough, try to add more New or Critical that were skipped
            if (selected.length < count) {
                const remainingNew = newWords.filter(w => !selected.includes(w))
                const moreNew = this.shuffle(remainingNew).slice(0, count - selected.length)
                selected = [...selected, ...moreNew]
            }

            if (selected.length < count) {
                const remainingCritical = criticalReviewWords.filter(w => !selected.includes(w))
                const moreCritical = this.shuffle(remainingCritical).slice(0, count - selected.length)
                selected = [...selected, ...moreCritical]
            }
        }

        return selected
    },

    shuffle<T>(array: T[]): T[] {
        const newArray = [...array]
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
        }
        return newArray
    },
}
