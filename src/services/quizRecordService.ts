import { db, QuizRecord } from './db'

export const quizRecordService = {
    /**
     * Get all quiz records for a specific article (by article UUID).
     * @param articleUuid The UUID of the article
     * @returns Array of quiz records sorted by date descending (newest first)
     */
    async getRecordsByArticleUuid(articleUuid: string): Promise<QuizRecord[]> {
        return await db.quizRecords
            .where('articleId')
            .equals(articleUuid)
            .reverse()
            .sortBy('date')
    },

    /**
     * Save a new quiz record.
     * @param record The quiz record data (excluding id)
     * @returns The id of the newly created record
     */
    async saveQuizRecord(record: Omit<QuizRecord, 'id'>): Promise<number> {
        return await db.quizRecords.add(record)
    },

    /**
     * Get all quiz records.
     * @returns Array of all quiz records sorted by date descending
     */
    async getAll(): Promise<QuizRecord[]> {
        return await db.quizRecords.orderBy('date').reverse().toArray()
    },

    /**
     * Delete a quiz record by ID.
     */
    async delete(id: number): Promise<void> {
        return await db.quizRecords.delete(id)
    },

    /**
     * Delete all quiz records for a specific article.
     */
    async deleteByArticleUuid(articleUuid: string): Promise<number> {
        return await db.quizRecords.where('articleId').equals(articleUuid).delete()
    }
}
