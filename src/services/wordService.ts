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
}
