import { db, Article } from './db'

export const articleService = {
    /**
     * Add a new article to the database.
     * @param article The article data (excluding id and createdAt, which are auto-generated/handled)
     * @returns The id of the newly created article.
     */
    async add(article: Omit<Article, 'id' | 'createdAt'>): Promise<number> {
        const newArticle: Article = {
            ...article,
            createdAt: Date.now(),
        }
        return await db.articles.add(newArticle)
    },

    /**
     * Get all articles, sorted by creation date descending (newest first).
     */
    async getAll(): Promise<Article[]> {
        return await db.articles.orderBy('createdAt').reverse().toArray()
    },

    /**
     * Get a single article by its numeric ID.
     */
    async getById(id: number): Promise<Article | undefined> {
        return await db.articles.get(id)
    },

    /**
     * Get a single article by its UUID.
     */
    async getByUuid(uuid: string): Promise<Article | undefined> {
        return await db.articles.where('uuid').equals(uuid).first()
    },

    /**
     * Delete an article by its ID.
     * Note: This should ideally also delete related quiz records.
     */
    async delete(id: number): Promise<void> {
        // Optional: Delete related quiz records?
        // For now, let's just delete the article.
        // Ideally:
        // const article = await this.getById(id)
        // if (article) {
        //   await db.quizRecords.where('articleId').equals(article.uuid).delete()
        // }
        return await db.articles.delete(id)
    },

    /**
     * Clear all articles (debug use).
     */
    async clearAll(): Promise<void> {
        return await db.articles.clear()
    }
}
