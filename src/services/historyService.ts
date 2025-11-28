import { db, History } from './db'

export const historyService = {
    async saveArticleRecord(record: Omit<History, 'id'>) {
        return await db.history.add(record)
    },

    async getHistory() {
        return await db.history.orderBy('date').reverse().toArray()
    },

    async getHistoryById(id: number): Promise<History | undefined> {
        return await db.history.get(id)
    },

    async clearHistory(): Promise<void> {
        await db.history.clear()
    }
}
