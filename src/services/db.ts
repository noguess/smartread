import Dexie, { Table } from 'dexie'

export type WordStatus = 'New' | 'Learning' | 'Review' | 'Mastered'

export interface Word {
    id?: number
    spelling: string
    phonetic?: string
    meaning: string
    status: WordStatus
    nextReviewAt: number // Timestamp
    interval: number // Days
    repetitionCount: number
    lastSeenAt: number // Timestamp
}

export interface History {
    id?: number
    date: number
    title?: string
    articleContent: string
    targetWords: string[]
    questionsJson: { reading: any[]; vocabulary: any[] } | any // Union type for compatibility
    userScore: number
    difficultyFeedback: number
    timeSpent?: number // Time spent in seconds
    wordResults?: { [spelling: string]: boolean }
    userAnswers?: {
        reading: Record<string, string>
        vocabulary: Record<string, string | string[]>
    }
}

export interface Article {
    id?: number
    uuid: string // v4 uuid
    title: string
    content: string // Markdown content
    targetWords: string[]
    difficultyLevel: 'L1' | 'L2' | 'L3'
    createdAt: number
    source: 'generated' | 'imported'
}

export interface QuizRecord {
    id?: number
    articleId: string // References Article.uuid
    date: number
    questions: any // Snapshot of generated questions
    userAnswers: any
    score: number
    difficultyFeedback: number
    timeSpent?: number
    wordResults?: { [spelling: string]: boolean } // For SRS algorithm
}

export interface Setting {
    id?: number
    apiKey: string
    apiBaseUrl?: string
    articleLenPref: 'short' | 'medium' | 'long'
    dailyNewLimit: number
    difficultyLevel: 'L1' | 'L2' | 'L3'
}

export class SmartReaderDB extends Dexie {
    words!: Table<Word>
    history!: Table<History> // Legacy V1 table
    settings!: Table<Setting>

    // V2 Tables
    articles!: Table<Article>
    quizRecords!: Table<QuizRecord>

    constructor() {
        super('SmartReaderDB_v2')

        // Version 1
        this.version(1).stores({
            words: '++id, spelling, status, nextReviewAt',
            history: '++id, date',
            settings: '++id',
        })

        // Version 3: Remove duplicates first to allow unique index creation
        this.version(3).upgrade(async tx => {
            const articles = await tx.table('articles').toArray()
            const seen = new Set<string>()
            const toDelete: number[] = []

            for (const a of articles) {
                if (seen.has(a.uuid)) {
                    toDelete.push(a.id!)
                } else {
                    seen.add(a.uuid)
                }
            }

            if (toDelete.length > 0) {
                console.warn(`Cleaning up ${toDelete.length} duplicate articles during migration`)
                await tx.table('articles').bulkDelete(toDelete)
            }
        })

        // Version 4: Add unique index to articles.uuid (now safe)
        this.version(4).stores({
            words: '++id, spelling, status, nextReviewAt', // Re-declare to be safe
            history: '++id, date',
            settings: '++id',
            articles: '++id, &uuid, createdAt', // & means unique index
            quizRecords: '++id, articleId, date'
        })
    }
}

export const db = new SmartReaderDB()

