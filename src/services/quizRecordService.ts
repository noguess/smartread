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
     * Get a single quiz record by its unique ID.
     * @param id The ID of the quiz record
     * @returns The quiz record or undefined if not found
     */
    async getQuizRecordById(id: number): Promise<QuizRecord | undefined> {
        return await db.quizRecords.get(id)
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
    },

    /**
     * Update an existing quiz record.
     * @param id The ID of the record to update
     * @param changes Partial object containing changes
     * @returns Promise<number> 1 if updated, 0 if not
     */
    async updateQuizRecord(id: number, changes: Partial<QuizRecord>): Promise<number> {
        return await db.quizRecords.update(id, changes)
    }
}
