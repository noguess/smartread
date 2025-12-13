/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { quizRecordService } from './quizRecordService'
import { db } from './db'

// Mock Dexie
vi.mock('./db', () => ({
    db: {
        quizRecords: {
            get: vi.fn(),
            add: vi.fn(),
            update: vi.fn(),
            where: vi.fn(() => ({
                equals: vi.fn(() => ({
                    reverse: vi.fn(() => ({
                        sortBy: vi.fn()
                    })),
                    delete: vi.fn()
                }))
            })),
            orderBy: vi.fn(() => ({
                reverse: vi.fn(() => ({
                    toArray: vi.fn()
                }))
            })),
            delete: vi.fn()
        }
    }
}))

describe('quizRecordService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('getQuizRecordById calls db.get with correct ID', async () => {
        const mockRecord = { id: 101, score: 90 }
        vi.mocked(db.quizRecords.get).mockResolvedValue(mockRecord as any)

        const result = await quizRecordService.getQuizRecordById(101)

        expect(db.quizRecords.get).toHaveBeenCalledWith(101)
        expect(result).toEqual(mockRecord)
    })

    it('getQuizRecordById returns undefined if not found', async () => {
        vi.mocked(db.quizRecords.get).mockResolvedValue(undefined)

        const result = await quizRecordService.getQuizRecordById(999)

        expect(result).toBeUndefined()
    })

    it('saveQuizRecord calls db.add', async () => {
        vi.mocked(db.quizRecords.add).mockResolvedValue(123)
        const record = { articleId: 'uuid-1' } as any

        const id = await quizRecordService.saveQuizRecord(record)

        expect(db.quizRecords.add).toHaveBeenCalledWith(record)
        expect(id).toBe(123)
    })
})
