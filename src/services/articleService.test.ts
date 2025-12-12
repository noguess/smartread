import { describe, it, expect, beforeEach, vi } from 'vitest'
import { articleService } from './articleService'
import { db } from './db'

// Mock Dexie
vi.mock('./db', () => {
    const mockToArray = vi.fn()
    const mockReverse = vi.fn(() => ({
        toArray: mockToArray,
        offset: vi.fn(() => ({
            limit: vi.fn(() => ({
                toArray: mockToArray
            }))
        }))
    }))
    const mockOrderBy = vi.fn(() => ({
        reverse: mockReverse
    }))

    return {
        db: {
            articles: {
                orderBy: mockOrderBy,
                add: vi.fn(),
                get: vi.fn(),
                where: vi.fn(() => ({
                    equals: vi.fn(() => ({
                        first: vi.fn()
                    }))
                })),
                delete: vi.fn(),
                clear: vi.fn()
            }
        }
    }
})

describe('articleService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getPage', () => {
        // Need to cast to any to access mocked methods if TS complains, or rely on vi.mocked
        // But since we mocked the whole module, we can inspect calls.

        it('should call db with correct offset and limit', async () => {
            // Setup mock data return
            const mockData = [{ id: 1 }, { id: 2 }]
            // We need to drill down to the toArray mock
            const mockToArray = vi.fn().mockResolvedValue(mockData)
            const mockLimit = vi.fn(() => ({ toArray: mockToArray }))
            const mockOffset = vi.fn(() => ({ limit: mockLimit }))
            const mockReverse = vi.fn(() => ({
                offset: mockOffset,
                toArray: mockToArray // fallback if no offset used
            }))
            const mockOrderBy = vi.fn(() => ({ reverse: mockReverse }))

            // Re-assign to db.articles for this test

            // @ts-expect-error
            db.articles.orderBy = mockOrderBy

            const page = 1
            const pageSize = 10


            await articleService.getPage(page, pageSize)

            // Verify chain: orderBy('createdAt').reverse().offset(0).limit(10).toArray()
            expect(mockOrderBy).toHaveBeenCalledWith('createdAt')
            expect(mockReverse).toHaveBeenCalled()
            expect(mockOffset).toHaveBeenCalledWith(0)
            expect(mockLimit).toHaveBeenCalledWith(10)
            expect(mockToArray).toHaveBeenCalled()
        })

        it('should calculate offset correctly for page 2', async () => {
            const mockToArray = vi.fn().mockResolvedValue([])
            const mockLimit = vi.fn(() => ({ toArray: mockToArray }))
            const mockOffset = vi.fn(() => ({ limit: mockLimit }))
            const mockReverse = vi.fn(() => ({ offset: mockOffset }))
            const mockOrderBy = vi.fn(() => ({ reverse: mockReverse }))


            // @ts-expect-error
            db.articles.orderBy = mockOrderBy

            await articleService.getPage(2, 5) // Page 2, size 5 -> offset 5

            expect(mockOffset).toHaveBeenCalledWith(5)
            expect(mockLimit).toHaveBeenCalledWith(5)
        })
    })
})
