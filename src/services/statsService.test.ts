import { describe, it, expect, vi, beforeEach } from 'vitest'
import { statsService } from './statsService'
import { db, Article, QuizRecord, History, Word } from './db'

// Mock Dexie
vi.mock('./db', () => {
    return {
        db: {
            words: { toArray: vi.fn() },
            history: { toArray: vi.fn() },
            quizRecords: { toArray: vi.fn() },
            articles: { toArray: vi.fn() },
            transact: vi.fn((mode, tables, callback) => callback())
        }
    }
})

describe('StatsService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getOverviewStats', () => {
        it('should aggregate word stats correctly', async () => {
            const mockWords: Partial<Word>[] = [
                { status: 'New', spelling: 'a', meaning: '', nextReviewAt: 0, interval: 0, repetitionCount: 0, lastSeenAt: 0 },
                { status: 'Mastered', spelling: 'b', meaning: '', nextReviewAt: 0, interval: 0, repetitionCount: 0, lastSeenAt: 0 },
                { status: 'New', spelling: 'c', meaning: '', nextReviewAt: 0, interval: 0, repetitionCount: 0, lastSeenAt: 0 }
            ];
            (db.words.toArray as any).mockResolvedValue(mockWords as any);
            (db.history.toArray as any).mockResolvedValue([]);
            (db.quizRecords.toArray as any).mockResolvedValue([]);
            (db.articles.toArray as any).mockResolvedValue([]);

            const stats = await statsService.getOverviewStats()

            expect(stats.wordStats['New']).toBe(2)
            expect(stats.wordStats['Mastered']).toBe(1)
            expect(stats.wordStats['Learning']).toBe(0)
        })

        it('should aggregate activity and difficulty stats', async () => {
            (db.words.toArray as any).mockResolvedValue([]);

            // 2 Legacy Items
            const mockHistory: Partial<History>[] = [
                { id: 1, date: Date.now(), articleContent: '', targetWords: [], questionsJson: { reading: [], vocabulary: [] }, userScore: 80, difficultyFeedback: 0 },
                { id: 2, date: Date.now(), articleContent: '', targetWords: [], questionsJson: { reading: [], vocabulary: [] }, userScore: 90, difficultyFeedback: 0 }
            ];
            (db.history.toArray as any).mockResolvedValue(mockHistory);

            // 1 V2 Article (L2)
            const mockArticle: Partial<Article> = {
                uuid: 'uuid-1', difficultyLevel: 'L2', title: 'Test', content: 'hello world', targetWords: [], createdAt: 0, source: 'generated'
            };
            (db.articles.toArray as any).mockResolvedValue([mockArticle]);

            // 1 V2 QuizRecord for that article
            const mockQuiz: Partial<QuizRecord> = {
                articleId: 'uuid-1', date: Date.now(), questions: { reading: [], vocabulary: [] },
                readingDuration: 60, quizDuration: 30
            };
            (db.quizRecords.toArray as any).mockResolvedValue([mockQuiz]);

            const stats = await statsService.getOverviewStats()

            // Total = 2 legacy + 1 V2
            expect(stats.activityStats.totalArticles).toBe(3)
            expect(stats.activityStats.totalQuizzes).toBe(3)

            // Difficulty
            // Legacy -> Unknown (2)
            // V2 -> L2 (1)
            expect(stats.difficultyStats.articles['Unknown']).toBe(2)
            expect(stats.difficultyStats.articles['L2']).toBe(1)
            expect(stats.difficultyStats.quizzes['L2']).toBe(1)

            // Score Distribution
            // Legacy: 80, 90 -> Unknown: '80-100': 2
            // V2: N/A in mock above, let's add score to V2 mock
            // Let's assume V2 mock has no score for now, so it won't affect distribution
            expect(stats.scoreDistribution['Unknown']['80-100']).toBe(2)
        })

        it('should distribute scores correctly', async () => {
            (db.words.toArray as any).mockResolvedValue([]);
            (db.history.toArray as any).mockResolvedValue([]);

            const mockArticle: Partial<Article> = { uuid: 'a1', difficultyLevel: 'L1', content: '', title: '', targetWords: [], createdAt: 0, source: 'generated' };
            (db.articles.toArray as any).mockResolvedValue([mockArticle]);

            const mockQuizzes: Partial<QuizRecord>[] = [
                { articleId: 'a1', score: 50, date: 0, questions: { reading: [], vocabulary: [] } },
                { articleId: 'a1', score: 70, date: 0, questions: { reading: [], vocabulary: [] } },
                { articleId: 'a1', score: 100, date: 0, questions: { reading: [], vocabulary: [] } }
            ];
            (db.quizRecords.toArray as any).mockResolvedValue(mockQuizzes);

            const stats = await statsService.getOverviewStats()

            expect(stats.scoreDistribution['L1']['0-59']).toBe(1)
            expect(stats.scoreDistribution['L1']['60-79']).toBe(1)
            expect(stats.scoreDistribution['L1']['80-100']).toBe(1)
        })

        it('should calculate efficiency stats', async () => {
            (db.words.toArray as any).mockResolvedValue([]);
            (db.history.toArray as any).mockResolvedValue([]);

            const mockArticle: Partial<Article> = {
                uuid: 'uuid-1', difficultyLevel: 'L2', content: 'word '.repeat(100).trim(),
                title: '', targetWords: [], createdAt: 0, source: 'generated'
            };
            (db.articles.toArray as any).mockResolvedValue([mockArticle]);

            // 100 words in 60 seconds = 100 WPM
            const mockQuiz: Partial<QuizRecord> = {
                articleId: 'uuid-1',
                date: Date.now(),
                questions: {
                    reading: [{ id: '1', stem: '', answer: '' }] as any,
                    vocabulary: []
                },
                readingDuration: 60,
                quizDuration: 10 // 1 question in 10s
            };
            (db.quizRecords.toArray as any).mockResolvedValue([mockQuiz]);

            const stats = await statsService.getOverviewStats()

            expect(stats.efficiencyStats.avgReadingSpeed['L2']).toBe(100)
            expect(stats.efficiencyStats.avgQuizTimePerQuestion['L2']).toBe(10)
        })
    })

    describe('getTrendStats', () => {
        it('should breakdown trends by difficulty', async () => {
            const today = new Date()
            const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

            (db.history.toArray as any).mockResolvedValue([]); // No legacy

            const mockArticles: Partial<Article>[] = [
                { uuid: 'a1', difficultyLevel: 'L1', title: '', content: '', targetWords: [], createdAt: 0, source: 'generated' },
                { uuid: 'a2', difficultyLevel: 'L3', title: '', content: '', targetWords: [], createdAt: 0, source: 'generated' }
            ];
            (db.articles.toArray as any).mockResolvedValue(mockArticles);

            const mockQuizzes: Partial<QuizRecord>[] = [
                // Today: 1 L1 quiz, Score 100
                { articleId: 'a1', date: today.getTime(), score: 100, readingDuration: 0, quizDuration: 0, questions: { reading: [], vocabulary: [] } },
                // Yesterday: 2 L3 quizzes, Score 50 & 70
                { articleId: 'a2', date: yesterday.getTime(), score: 50, readingDuration: 0, quizDuration: 0, questions: { reading: [], vocabulary: [] } },
                { articleId: 'a2', date: yesterday.getTime(), score: 70, readingDuration: 0, quizDuration: 0, questions: { reading: [], vocabulary: [] } },
            ];
            (db.quizRecords.toArray as any).mockResolvedValue(mockQuizzes);

            const trends = await statsService.getTrendStats(7)

            // Check Today
            const todayStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const todayStat = trends.find(t => t.date === todayStr)
            expect(todayStat).toBeDefined()
            expect(todayStat?.articles_L1).toBe(1)
            expect(todayStat?.articles_L2).toBe(0)
            expect(todayStat?.score_L1).toBe(100)

            // Check Yesterday
            const yesterdayStr = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const yesterdayStat = trends.find(t => t.date === yesterdayStr)
            expect(yesterdayStat?.articles_L3).toBe(2)
            expect(yesterdayStat?.score_L3).toBe(60) // (50+70)/2
        })
    })
})
