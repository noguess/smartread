import { db, Article, QuizRecord, History } from './db'
import { v4 as uuidv4 } from 'uuid'

export const migrateV1ToV2 = async () => {
    try {
        // 1. Safety Check: 已完成标志
        const hasMigrated = localStorage.getItem('migration_v1_v2_completed')
        if (hasMigrated === 'true') {
            return
        }

        // 2. Safety Check: 正在进行中锁 (防止多Tab并发)
        const isLock = localStorage.getItem('migration_v1_v2_lock')
        if (isLock === 'true') {
            console.warn('Migration V1->V2 is already in progress (locked). Skipping.')
            return
        }

        const historyCount = await db.history.count()
        const articleCount = await db.articles.count()

        // Only migrate if we have history but no articles (or logic to prevent duplicates)
        if (historyCount > 0 && articleCount === 0) {
            console.log('Starting migration from V1 to V2...')

            // Set Lock
            localStorage.setItem('migration_v1_v2_lock', 'true')

            try {
                // 3. Batch Processing (防止 OOM)
                const BATCH_SIZE = 50
                let offset = 0
                let totalMigrated = 0

                while (true) {
                    const histories = await db.history.offset(offset).limit(BATCH_SIZE).toArray() as History[]
                    if (histories.length === 0) break

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
                            difficultyLevel: 'L2',
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

                    // 4. Transactional Write (Batch)
                    await db.transaction('rw', db.articles, db.quizRecords, async () => {
                        await db.articles.bulkAdd(articles)
                        await db.quizRecords.bulkAdd(quizRecords)
                    })

                    console.log(`Migrated batch ${offset} - ${offset + histories.length}`)
                    offset += BATCH_SIZE
                    totalMigrated += histories.length
                }

                console.log(`Migration completed. Migrated ${totalMigrated} records.`)

                // Set Completed Flag & Remove Lock
                localStorage.setItem('migration_v1_v2_completed', 'true')
                localStorage.removeItem('migration_v1_v2_lock')

            } catch (err) {
                // If failed, remove lock so it can be retried (or keep it if you want to block until manual fix)
                // Here we remove it to allow retry on next reload
                localStorage.removeItem('migration_v1_v2_lock')
                throw err
            }
        }
    } catch (error) {
        console.error('Migration failed:', error)
        // Ensure lock is cleared on error
        localStorage.removeItem('migration_v1_v2_lock')
    }
}
