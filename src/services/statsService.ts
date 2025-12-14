import { db, WordStatus, Article, History, QuizRecord } from './db'

export interface OverviewStats {
    wordStats: Record<WordStatus, number>
    activityStats: {
        totalArticles: number
        totalQuizzes: number
    }
    difficultyStats: {
        articles: Record<string, number> // 'L1' | 'L2' | 'L3'
        quizzes: Record<string, number>
    }
    efficiencyStats: {
        avgReadingSpeed: Record<string, number> // Words Per Minute (WPM)
        avgQuizTimePerQuestion: Record<string, number> // Seconds
    }
    scoreDistribution: Record<string, {
        '0-59': number
        '60-79': number
        '80-100': number
    }>
}

export interface DailyTrend {
    date: string
    // Counts
    articles_L1: number
    articles_L2: number
    articles_L3: number
    articles_Total: number
    // Quiz Counts
    quizzes_L1: number
    quizzes_L2: number
    quizzes_L3: number
    quizzes_Total: number
    // Scores
    score_L1: number
    score_L2: number
    score_L3: number
    score_Avg: number
    // Time (Minutes)
    time_L1: number
    time_L2: number
    time_L3: number
    time_Avg: number
    // Avg Durations (Seconds)
    avgReadTime_L1: number
    avgReadTime_L2: number
    avgReadTime_L3: number
    avgQuizTime_L1: number
    avgQuizTime_L2: number
    avgQuizTime_L3: number
}

// Helper types for aggregation
interface DifficultyBucket {
    count: number
    scores: number[]
    times: number[]
    readTimes: number[]
    quizTimes: number[]
}

interface DailyBucket {
    L1: DifficultyBucket
    L2: DifficultyBucket
    L3: DifficultyBucket
    Unknown: DifficultyBucket
}

export const statsService = {
    async getOverviewStats(): Promise<OverviewStats> {
        const words = await db.words.toArray()
        const history: History[] = await db.history.toArray()
        const quizRecords: QuizRecord[] = await db.quizRecords.toArray()
        const articles = await db.articles.toArray()

        // 1. Word Stats
        const wordStats: Record<WordStatus, number> = {
            'New': 0,
            'Learning': 0,
            'Review': 0,
            'Mastered': 0
        }
        words.forEach(w => {
            if (wordStats[w.status] !== undefined) {
                wordStats[w.status]++
            }
        })

        // 2. Activity & Difficulty & Score Distribution
        const difficultyStats: {
            articles: Record<string, number>;
            quizzes: Record<string, number>;
        } = {
            articles: { 'L1': 0, 'L2': 0, 'L3': 0, 'Unknown': 0 },
            quizzes: { 'L1': 0, 'L2': 0, 'L3': 0, 'Unknown': 0 }
        }

        const scoreDistribution: Record<string, { '0-59': number; '60-79': number; '80-100': number }> = {
            'L1': { '0-59': 0, '60-79': 0, '80-100': 0 },
            'L2': { '0-59': 0, '60-79': 0, '80-100': 0 },
            'L3': { '0-59': 0, '60-79': 0, '80-100': 0 },
            'Unknown': { '0-59': 0, '60-79': 0, '80-100': 0 }
        }

        let totalArticles = 0
        let totalQuizzes = 0

        const articleMap = new Map<string, Article>()
        articles.forEach(a => articleMap.set(a.uuid, a))

        const countDiff = (level: string | undefined, type: 'articles' | 'quizzes') => {
            const key = (level && ['L1', 'L2', 'L3'].includes(level)) ? level : 'Unknown'
            difficultyStats[type][key] = (difficultyStats[type][key] || 0) + 1
        }

        const trackScore = (level: string | undefined, score: number) => {
            const key = (level && ['L1', 'L2', 'L3'].includes(level)) ? level : 'Unknown'
            if (score < 60) scoreDistribution[key]['0-59']++
            else if (score < 80) scoreDistribution[key]['60-79']++
            else scoreDistribution[key]['80-100']++
        }

        // Feature: Estimate reading speed / efficiency
        const readingSpeedSamples: Record<string, number[]> = { 'L1': [], 'L2': [], 'L3': [], 'Unknown': [] }
        const quizSpeedSamples: Record<string, number[]> = { 'L1': [], 'L2': [], 'L3': [], 'Unknown': [] }

        // Process Legacy History
        history.forEach(h => {
            totalArticles++
            totalQuizzes++
            countDiff('Unknown', 'articles')
            countDiff('Unknown', 'quizzes')
            if (h.userScore !== undefined) trackScore('Unknown', h.userScore)
        })

        // Process V2
        quizRecords.forEach(q => {
            totalArticles++
            totalQuizzes++
            const article = articleMap.get(q.articleId)
            const level = (article?.difficultyLevel && ['L1', 'L2', 'L3'].includes(article.difficultyLevel)) ? article.difficultyLevel : 'Unknown'

            countDiff(level, 'articles')
            countDiff(level, 'quizzes')
            if (q.score !== undefined) trackScore(level, q.score)

            // Collecting Speed Samples
            if (q.readingDuration && q.readingDuration > 0 && article?.content) {
                const wordCount = article.content.split(/\s+/).length
                const wpm = (wordCount / q.readingDuration) * 60
                if (wpm > 10 && wpm < 1000) readingSpeedSamples[level].push(wpm)
            }
            if (q.quizDuration && q.quizDuration > 0) {
                const qCount = (q.questions?.reading?.length || 0) + (q.questions?.vocabulary?.length || 0)
                if (qCount > 0) {
                    const secPerQ = q.quizDuration / qCount
                    quizSpeedSamples[level].push(secPerQ)
                }
            }
        })

        const calcAvg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

        const avgReadingSpeed: Record<string, number> = {}
        const avgQuizTimePerQuestion: Record<string, number> = {}

        const levels = ['L1', 'L2', 'L3', 'Unknown']
        levels.forEach(l => {
            avgReadingSpeed[l] = calcAvg(readingSpeedSamples[l])
            avgQuizTimePerQuestion[l] = calcAvg(quizSpeedSamples[l])
        })

        return {
            wordStats,
            activityStats: { totalArticles, totalQuizzes },
            difficultyStats,
            efficiencyStats: { avgReadingSpeed, avgQuizTimePerQuestion },
            scoreDistribution
        }
    },

    async getTrendStats(days: number = 7): Promise<DailyTrend[]> {
        const history: History[] = await db.history.toArray()
        const quizRecords: QuizRecord[] = await db.quizRecords.toArray()
        const articles = await db.articles.toArray()
        const articleMap = new Map<string, Article>()
        articles.forEach(a => articleMap.set(a.uuid, a))

        // Prepare daily buckets
        const buckets = new Map<string, DailyBucket>()

        // Helper to init bucket
        const getBucket = (date: string): DailyBucket => {
            if (!buckets.has(date)) {
                buckets.set(date, {
                    L1: { count: 0, scores: [], times: [], readTimes: [], quizTimes: [] },
                    L2: { count: 0, scores: [], times: [], readTimes: [], quizTimes: [] },
                    L3: { count: 0, scores: [], times: [], readTimes: [], quizTimes: [] },
                    Unknown: { count: 0, scores: [], times: [], readTimes: [], quizTimes: [] }
                })
            }
            return buckets.get(date)!
        }

        const getDayKey = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        // Process Legacy
        history.forEach(h => {
            const key = getDayKey(h.date)
            const b = getBucket(key)
            // Legacy is Unknown
            b.Unknown.count++
            if (h.userScore !== undefined) b.Unknown.scores.push(h.userScore)
            // Legacy timeSpent is likely total session time, can't split easily. 
            // We'll treat it as generic 'time' but NOT 'readTime' or 'quizTime' to avoid skewing unless we assume distribution.
            // Only add to total time.
            if (h.timeSpent) b.Unknown.times.push(h.timeSpent)
        })

        // Process V2
        quizRecords.forEach(q => {
            const key = getDayKey(q.date)
            const b = getBucket(key)
            const article = articleMap.get(q.articleId)
            const level = (article?.difficultyLevel && ['L1', 'L2', 'L3'].includes(article.difficultyLevel))
                ? article.difficultyLevel as 'L1' | 'L2' | 'L3'
                : 'Unknown'

            b[level].count++
            if (q.score !== undefined) b[level].scores.push(q.score)

            const rTime = q.readingDuration || 0
            const qTime = q.quizDuration || 0
            const totalTime = rTime + qTime

            if (totalTime > 0) b[level].times.push(totalTime)
            if (rTime > 0) b[level].readTimes.push(rTime)
            if (qTime > 0) b[level].quizTimes.push(qTime)
        })

        // Build Result
        const result: DailyTrend[] = []
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            const emptyBucketVal: DifficultyBucket = { count: 0, scores: [], times: [], readTimes: [], quizTimes: [] }
            const emptyBucket: DailyBucket = {
                L1: { ...emptyBucketVal },
                L2: { ...emptyBucketVal },
                L3: { ...emptyBucketVal },
                Unknown: { ...emptyBucketVal }
            }

            const b = buckets.get(dateStr) || emptyBucket

            const calcAvg = (nums: number[]) => nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0

            const articles_Total = b.L1.count + b.L2.count + b.L3.count + b.Unknown.count
            const quizzes_Total = articles_Total // Assuming 1:1 for now

            // Weighted average for "Avg Score"
            const allScores = [...b.L1.scores, ...b.L2.scores, ...b.L3.scores, ...b.Unknown.scores]
            const score_Avg = Math.round(calcAvg(allScores))

            // Avg Time (Minutes) - Total Study Time
            // Wait, previous request (Step 144) says "Daily study time can stay". 
            // BUT "I also want... change in time used to read... change in time used to quiz".
            // So `time_Lx` should probably represent TOTAL time (sum) to show "Effort Trend"?
            // Or "Avg Session Time"?
            // User said "Study Time Trend (Minutes)" in screenshot title.
            // In Step 143, I said "Currently it shows Avg... I will change to Total".
            // So `time_Lx` -> SUM (Total Duration in Minutes).

            const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0)

            const time_L1 = Math.round(sum(b.L1.times) / 60)
            const time_L2 = Math.round(sum(b.L2.times) / 60)
            const time_L3 = Math.round(sum(b.L3.times) / 60)
            const allTimes = [...b.L1.times, ...b.L2.times, ...b.L3.times, ...b.Unknown.times]
            const time_Avg = Math.round(sum(allTimes) / 60) // Total time

            // Avg Durations (Seconds)
            const avgReadTime_L1 = Math.round(calcAvg(b.L1.readTimes))
            const avgReadTime_L2 = Math.round(calcAvg(b.L2.readTimes))
            const avgReadTime_L3 = Math.round(calcAvg(b.L3.readTimes))

            const avgQuizTime_L1 = Math.round(calcAvg(b.L1.quizTimes))
            const avgQuizTime_L2 = Math.round(calcAvg(b.L2.quizTimes))
            const avgQuizTime_L3 = Math.round(calcAvg(b.L3.quizTimes))

            result.push({
                date: dateStr,
                articles_L1: b.L1.count,
                articles_L2: b.L2.count,
                articles_L3: b.L3.count,
                articles_Total,
                quizzes_L1: b.L1.count, // Simplified
                quizzes_L2: b.L2.count,
                quizzes_L3: b.L3.count,
                quizzes_Total,
                score_L1: Math.round(calcAvg(b.L1.scores)),
                score_L2: Math.round(calcAvg(b.L2.scores)),
                score_L3: Math.round(calcAvg(b.L3.scores)),
                score_Avg,
                time_L1,
                time_L2,
                time_L3,
                time_Avg,
                avgReadTime_L1,
                avgReadTime_L2,
                avgReadTime_L3,
                avgQuizTime_L1,
                avgQuizTime_L2,
                avgQuizTime_L3
            })
        }
        return result
    }
}
