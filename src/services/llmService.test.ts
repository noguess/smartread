
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { llmService } from './llmService'

// Mock fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('llmService', () => {
    beforeEach(() => {
        mockFetch.mockReset()
    })

    it('analyzeSentence sends correct 5-step analysis prompt', async () => {
        // Mock successful response
        const mockResponse = {
            ok: true,
            headers: { get: () => '1000' },
            body: {
                getReader: () => ({
                    read: vi.fn()
                        .mockResolvedValueOnce({
                            done: false, value: new TextEncoder().encode(JSON.stringify({
                                choices: [{ message: { content: '{}' } }]
                            }))
                        })
                        .mockResolvedValueOnce({ done: true })
                })
            }
        }
        mockFetch.mockResolvedValue(mockResponse)

        await llmService.analyzeSentence("Test sentence.", { apiKey: 'test' } as any)

        expect(mockFetch).toHaveBeenCalledTimes(1)
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)

        // Assert System Prompt contains key phrases from the new requirement
        const systemPrompt = body.messages[0].content
        expect(systemPrompt).toContain('5步分析法')
        expect(systemPrompt).toContain('Translation')
        expect(systemPrompt).toContain('The Skeleton')
        expect(systemPrompt).toContain('Structure Breakdown')
    })
})
