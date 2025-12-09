import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analysisStorageService } from './analysisStorageService'
import { db } from './db'

// Mock the db instance
vi.mock('./db', () => {
    const mockTable = {
        add: vi.fn(),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        toArray: vi.fn()
    }
    return {
        db: {
            sentenceAnalysis: mockTable
        }
    }
})

describe('analysisStorageService', () => {
    const mockTable = db.sentenceAnalysis

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('saveAnalysis', () => {
        it('should save analysis record correctly', async () => {
            const articleId = 'uuid-123'
            const sentence = 'Hello world'
            const result = '## Analysis'

            await analysisStorageService.saveAnalysis(articleId, sentence, result)

            expect(mockTable.add).toHaveBeenCalledWith({
                articleId,
                originalSentence: sentence,
                analysisResult: result,
                createdAt: expect.any(Number)
            })
        })
    })

    describe('findMatchingAnalysis', () => {
        const articleId = 'uuid-123'
        const storedSentence = 'The quick brown fox jumps over the lazy dog'
        const storedAnalysis = 'Analysis of full sentence'

        beforeEach(() => {
            // Setup default mock return for this article
            vi.mocked(mockTable.toArray).mockResolvedValue([
                {
                    id: 1,
                    articleId,
                    originalSentence: storedSentence,
                    analysisResult: storedAnalysis,
                    createdAt: 1000
                }
            ])
        })

        it('should return match for exact string', async () => {
            const result = await analysisStorageService.findMatchingAnalysis(articleId, storedSentence)
            expect(result).toBeDefined()
            expect(result?.analysisResult).toBe(storedAnalysis)
        })

        it('should return match for substring (>50% coverage)', async () => {
            // "quick brown fox" is 3 words. Stored has them. Coverage = 3/3 = 100%
            const selection = 'quick brown fox'
            const result = await analysisStorageService.findMatchingAnalysis(articleId, selection)
            expect(result).toBeDefined()
        })

        it('should return match for fuzzy selection (>50% words match)', async () => {
            // "quick red fox" -> "quick", "fox" match. "red" no. 2/3 = 66%. Should match.
            const selection = 'quick red fox'
            const result = await analysisStorageService.findMatchingAnalysis(articleId, selection)
            expect(result).toBeDefined()
        })

        it('should NOT return match for low coverage (<50%)', async () => {
            // "hello world fox" -> "fox" matches. 1/3 = 33%. No match.
            const selection = 'hello world fox'
            const result = await analysisStorageService.findMatchingAnalysis(articleId, selection)
            expect(result).toBeNull()
        })

        it('should normalize punctuation and case', async () => {
            // "The, quick! BROWN... fox?" -> matches "The quick brown fox..."
            const selection = 'The, quick! BROWN... fox?'
            const result = await analysisStorageService.findMatchingAnalysis(articleId, selection)
            expect(result).toBeDefined()
        })
    })
})
