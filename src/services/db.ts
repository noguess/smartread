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
    pinnedVideo?: {
        bvid: string
        page: number
        startTime: number
    }
}

export interface BaseQuestion {
    id: string
    stem: string
    answer: string | string[]
    // Common optional fields
    difficulty?: 'L1' | 'L2' | 'L3' // Explicit difficulty on question level if needed
}

export interface MultipleChoiceQuestion extends BaseQuestion {
    type: 'multiple_choice' | 'audioSelection' | 'synonym' | 'contextual' // Grouping similar "Pick one from options" types
    options: string[]
    explanation?: string
}

export interface ClozeQuestion extends BaseQuestion {
    type: 'cloze' | 'spelling' | 'wordForm' // Fill in the blank types
    hint?: string
    explanation?: string
}

export interface MatchingQuestion extends BaseQuestion {
    type: 'matching' | 'synonymAntonym'
    pairs: { word: string; definition: string }[]
}

// Fallback/Generic for others or types we haven't strictly narrowed yet
export interface GenericQuestion extends BaseQuestion {
    type: 'definition' | 'audio' | 'spellingInput' | 'audioDictation' | 'input'
    subType?: string
    targetWord?: string
    hint?: string
    explanation?: string
    options?: string[]
    audioUrl?: string
    phonetic?: string
    pairs?: { word: string; definition: string }[]
}

export type Question = MultipleChoiceQuestion | ClozeQuestion | MatchingQuestion | GenericQuestion

export interface History {
    id?: number
    date: number
    title?: string
    articleContent: string
    targetWords: string[]
    questionsJson: { reading: Question[]; vocabulary: Question[] }
    userScore: number
    difficultyFeedback: number
    timeSpent?: number // Time spent in seconds
    wordResults?: { [spelling: string]: boolean }
    userAnswers?: {
        reading: Record<string, string>
        vocabulary: Record<string, string | string[]>
    }
}

export interface WordStudyItem {
    word: string
    part_of_speech: string
    meaning_in_context: string
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
    wordCtxMeanings?: WordStudyItem[]
}

export interface QuizRecord {
    id?: number
    articleId: string // References Article.uuid
    date: number
    questions: { reading: Question[]; vocabulary: Question[] }
    userAnswers?: {
        reading: Record<string, string>
        vocabulary: Record<string, string | string[]>
    }
    score?: number
    difficultyFeedback?: number
    timeSpent?: number
    readingDuration?: number // Seconds spent reading before quiz
    quizDuration?: number    // Seconds spent taking the quiz
    wordResults?: { [spelling: string]: boolean } // For SRS algorithm
}

export interface Setting {
    id?: number
    apiKey: string
    apiBaseUrl?: string
    articleLenPref: 'short' | 'medium' | 'long'
    dailyNewLimit: number
    difficultyLevel: 'L1' | 'L2' | 'L3'
    videoSource?: 'bilibili' | 'youtube'
    hasCompletedOnboarding?: boolean
}

export interface SentenceAnalysis {
    id?: number
    articleId: string
    originalSentence: string
    analysisResult: string
    createdAt: number
}

export class SmartReaderDB extends Dexie {
    words!: Table<Word>
    history!: Table<History> // Legacy V1 table
    settings!: Table<Setting>

    // V2 Tables
    articles!: Table<Article>
    quizRecords!: Table<QuizRecord>

    // V3 Tables
    sentenceAnalysis!: Table<SentenceAnalysis>

    constructor() {
        super('SmartReaderDB_v2')

        // Version 1
        this.version(1).stores({
            words: '++id, spelling, status, nextReviewAt',
            history: '++id, date',
            settings: '++id',
        })

        // Version 2: Add articles and quizRecords
        this.version(2).stores({
            words: '++id, spelling, status, nextReviewAt',
            history: '++id, date',
            settings: '++id',
            articles: '++id, uuid, createdAt',
            quizRecords: '++id, articleId, date'
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

        // Version 5: Add Sentence Analysis
        this.version(5).stores({
            sentenceAnalysis: '++id, articleId'
        })
    }
}

export const db = new SmartReaderDB()

