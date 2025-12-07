
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { llmService } from './llmService'

// Mock global fetch
global.fetch = vi.fn()

describe('llmService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('generateQuizForArticle constructs correct prompt with explanation requirement', async () => {
        const mockSettings: any = {
            apiKey: 'test-key',
            difficultyLevel: 'L2'
        }

        // Mock successful API response
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            headers: {
                get: () => '100' // Content-Length
            },
            body: {
                getReader: () => ({
                    read: vi.fn()
                        .mockResolvedValueOnce({
                            done: false, value: new TextEncoder().encode(JSON.stringify({
                                choices: [{ message: { content: JSON.stringify({ readingQuestions: [], vocabularyQuestions: [] }) } }]
                            }))
                        })
                        .mockResolvedValueOnce({ done: true })
                })
            }
        } as any)

        await llmService.generateQuizForArticle('Article Content', [], mockSettings)

        // Check fetch arguments
        expect(fetch).toHaveBeenCalledTimes(1)
        const callArgs = vi.mocked(fetch).mock.calls[0]
        const body = JSON.parse(callArgs[1]?.body as string)

        // Verify system prompt contains key requirements
        const systemPrompt = body.messages[0].content
        expect(systemPrompt).toContain('Always include "explanation" field')
        expect(systemPrompt).toContain('"explanation": "Brief explanation')
    })

    it('throws error if API key is missing', async () => {
        await expect(llmService.generateArticleOnly([], { apiKey: '' } as any))
            .rejects.toThrow('API Key is missing')
    })
})
