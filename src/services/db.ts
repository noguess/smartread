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
    history!: Table<History>
    settings!: Table<Setting>

    constructor() {
        super('SmartReaderDB_v2')
        this.version(1).stores({
            words: '++id, spelling, status, nextReviewAt',
            history: '++id, date',
            settings: '++id',
        })
    }
}

export const db = new SmartReaderDB()

