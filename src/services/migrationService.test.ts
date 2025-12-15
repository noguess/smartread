
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { migrateV1ToV2 } from './migrationService'
import { db } from './db'

// Mock Dexie
vi.mock('./db', () => ({
    db: {
        history: {
            count: vi.fn(),
            toArray: vi.fn(),
            offset: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
        },
        articles: {
            count: vi.fn(),
            bulkAdd: vi.fn(),
        },
        quizRecords: {
            bulkAdd: vi.fn(),
        },
        transaction: vi.fn(async (_mode, tables, callback) => {
            // In Dexie, the callback is the 3rd or 2nd argument depending on overload
            // Simplified mock: just find the function argument and call it
            const fn = typeof tables === 'function' ? tables : callback;
            if (typeof fn === 'function') {
                return await fn();
            }
        }),
    }
}))

describe('migrateV1ToV2', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    it('should skip migration if already completed (flag in localStorage)', async () => {
        localStorage.setItem('migration_v1_v2_completed', 'true')
        await migrateV1ToV2()
        expect(db.history.count).not.toHaveBeenCalled()
    })

    it('should skip migration if lock exists (race condition prevention)', async () => {
        localStorage.setItem('migration_v1_v2_lock', 'true')
        await migrateV1ToV2()
        expect(db.history.count).not.toHaveBeenCalled()
    })

    it('should migrate data in chunks if history exists and not migrated', async () => {
        // Setup state
        vi.mocked(db.history.count).mockResolvedValue(100)
        vi.mocked(db.articles.count).mockResolvedValue(0)

        // Mock data
        const mockHistoryItem = {
            id: 1,
            date: 1234567890,
            articleContent: 'test content',
            targetWords: ['test'],
            questionsJson: { reading: [], vocabulary: [] },
            userScore: 100,
            difficultyFeedback: 3
        }

        // Mock chunked return
        // First call return 50 items, second 50 items, third empty
        vi.mocked(db.history.offset).mockReturnValue({
            limit: vi.fn().mockReturnValue({
                toArray: vi.fn()
                    .mockResolvedValueOnce(Array(50).fill(mockHistoryItem))
                    .mockResolvedValueOnce(Array(50).fill(mockHistoryItem))
                    .mockResolvedValueOnce([])
            })
        } as any)

        await migrateV1ToV2()

        // Should have checked counts
        expect(db.history.count).toHaveBeenCalled()

        // Should have processed in batches (we'll implement batch size 50 or similar)
        // With 100 items, and if batch size is 50, it should be called roughly 2-3 times

        // Final state check
        expect(localStorage.getItem('migration_v1_v2_completed')).toBe('true')
        expect(localStorage.getItem('migration_v1_v2_lock')).toBeNull() // Lock should be released
    })
})
