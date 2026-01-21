import { db, Word, WordStatus } from './db'

export const wordService = {
    async addWord(word: Omit<Word, 'id'>) {
        return await db.words.add(word)
    },

    async getAllWords() {
        return await db.words.toArray()
    },

    async getWordsByStatus(status: WordStatus) {
        return await db.words.where('status').equals(status).toArray()
    },

    async getWordBySpelling(spelling: string) {
        return await db.words.where('spelling').equals(spelling).first()
    },

    async updateWordStatus(id: number, status: WordStatus, nextReviewAt: number, interval: number) {
        return await db.words.update(id, {
            status,
            nextReviewAt,
            interval,
            lastSeenAt: Date.now(),
        })
    },

    async updateWord(id: number, changes: Partial<Word>): Promise<any> {
        return await db.words.update(id, changes)
    },

    async resetAllProgress(): Promise<void> {
        // Reset all words to 'New' status and clear review data
        await db.words.toCollection().modify({
            status: 'New',
            nextReviewAt: 0,
            interval: 0,
            repetitionCount: 0
        })
    },

    async clearAllWords(): Promise<void> {
        await db.words.clear()
    },

    async deleteWord(id: number) {
        return await db.words.delete(id)
    },

    async getDailyCandidates(limit: number, excludeIds: number[] = []): Promise<Word[]> {
        const now = Date.now()
        const excludeSet = new Set(excludeIds)

        // 1. Get Due words first (Learning or Review status)
        const dueWords = await db.words
            .where('nextReviewAt')
            .belowOrEqual(now)
            .filter(w => (w.status === 'Learning' || w.status === 'Review') && !excludeSet.has(w.id!))
            .limit(limit)
            .toArray()

        if (dueWords.length >= limit) {
            return dueWords.slice(0, limit)
        }

        // 2. Fill with New words
        const needed = limit - dueWords.length
        const newWords = await db.words
            .where('status')
            .equals('New')
            .filter(w => !excludeSet.has(w.id!))
            .limit(needed)
            .toArray()

        return [...dueWords, ...newWords]
    },

    async importWords(words: Word[]): Promise<{ added: number, skipped: number }> {
        let added = 0
        let skipped = 0

        await db.transaction('rw', db.words, async () => {
            for (const word of words) {
                // Case-insensitive check
                const existing = await db.words
                    .where('spelling')
                    .equalsIgnoreCase(word.spelling)
                    .first()

                if (existing) {
                    skipped++
                } else {
                    await db.words.add({
                        ...word,
                        status: 'New',
                        easinessFactor: 2.5, // Default for new words
                        // Ensure defaults if not present
                        nextReviewAt: word.nextReviewAt || 0,
                        interval: word.interval || 0,
                        repetitionCount: word.repetitionCount || 0,
                        lastSeenAt: word.lastSeenAt || 0
                    })
                    added++
                }
            }
        })

        return { added, skipped }
    },
}
