import { db, Article, QuizRecord } from './db'
import { v4 as uuidv4 } from 'uuid'

export const migrateV1ToV2 = async () => {
    try {
        const historyCount = await db.history.count()
        const articleCount = await db.articles.count()

        // Only migrate if we have history but no articles (or logic to prevent duplicates)
        // Simple check: if articles are empty and history exists, migrate.
        if (historyCount > 0 && articleCount === 0) {
            console.log('Starting migration from V1 to V2...')

            const histories = await db.history.toArray()

            const articles: Article[] = []
            const quizRecords: QuizRecord[] = []

            for (const h of histories) {
                const articleId = uuidv4()

                // Create Article
                articles.push({
                    uuid: articleId,
                    title: h.title || 'Untitled Article',
                    content: h.articleContent,
                    targetWords: h.targetWords,
                    difficultyLevel: 'L2', // Default mapping as V1 didn't store level explicitly in history in standard way, or we imply it
                    createdAt: h.date,
                    source: 'generated'
                })

                // Create QuizRecord
                quizRecords.push({
                    articleId: articleId,
                    date: h.date,
                    questions: h.questionsJson,
                    userAnswers: h.userAnswers || { reading: {}, vocabulary: {} },
                    score: h.userScore,
                    difficultyFeedback: h.difficultyFeedback,
                    timeSpent: h.timeSpent
                })
            }

            await db.transaction('rw', db.articles, db.quizRecords, async () => {
                await db.articles.bulkAdd(articles)
                await db.quizRecords.bulkAdd(quizRecords)
            })

            console.log(`Migration completed. Migrated ${articles.length} articles and records.`)
        } else {
            console.log('Migration skipped: No history to migrate or migration already done.')
        }
    } catch (error) {
        console.error('Migration failed:', error)
    }
}
