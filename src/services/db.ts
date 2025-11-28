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
    questionsJson: any
    userScore: number
    difficultyFeedback: number
}

export interface Setting {
    id?: number
    apiKey: string
    apiBaseUrl?: string
    articleLenPref: 'short' | 'medium' | 'long'
    dailyNewLimit: number
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

export async function seedDatabase() {
    const count = await db.words.count()
    if (count === 0) {
        try {
            const response = await fetch('/cihuibiao/zkgaopinci666.csv')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const csvText = await response.text()
            const lines = csvText.split('\n').filter(line => line.trim() !== '')

            // Skip header
            const words: Omit<Word, 'id'>[] = []

            // Start from index 1 to skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i]
                // Simple CSV parsing: assuming no commas in phonetic/spelling
                // Format: 序号,单词,音标,词性及释义
                // But meaning might contain commas, so we split by comma and handle the rest
                const parts = line.split(',')

                if (parts.length >= 4) {
                    const spelling = parts[1].trim()
                    const phonetic = parts[2].trim()
                    // Rejoin the rest as meaning in case meaning contains commas
                    const meaning = parts.slice(3).join(',').trim()

                    if (spelling) {
                        words.push({
                            spelling,
                            phonetic,
                            meaning,
                            status: 'New',
                            nextReviewAt: 0,
                            interval: 0,
                            repetitionCount: 0,
                            lastSeenAt: 0
                        })
                    }
                }
            }

            if (words.length > 0) {
                await db.words.bulkAdd(words)
                console.log(`Database seeded with ${words.length} words from CSV`)
            }
        } catch (error) {
            console.error('Failed to seed database from CSV:', error)
        }
    }

    const settingsCount = await db.settings.count()
    if (settingsCount === 0) {
        await db.settings.add({
            apiKey: '',
            articleLenPref: 'medium',
            dailyNewLimit: 10
        })
        console.log('Database seeded with default settings')
    }
}
