
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
        expect(systemPrompt).toContain('翻译对照')
        expect(systemPrompt).toContain('核心骨架')
        expect(systemPrompt).toContain('结构拆解')
    })

    it('generateArticleOnly sends prompt with Word Study instructions', async () => {
        // Mock Response with word_study
        const mockResponseData = {
            title: "Test Article",
            content: "Content...",
            targetWords: ["light"],
            word_study: [
                { word: "light", part_of_speech: "v.", meaning_in_context: "点燃" }
            ]
        }

        const mockResponse = {
            ok: true,
            headers: { get: () => '1000' },
            body: {
                getReader: () => ({
                    read: vi.fn()
                        .mockResolvedValueOnce({
                            done: false, value: new TextEncoder().encode(JSON.stringify({
                                choices: [{ message: { content: JSON.stringify(mockResponseData) } }]
                            }))
                        })
                        .mockResolvedValueOnce({ done: true })
                })
            }
        }
        mockFetch.mockResolvedValue(mockResponse)

        const words = [{ spelling: 'light', meaning: '光' }] as any
        const settings = { apiKey: 'test', difficultyLevel: 'L2' } as any

        const result = await llmService.generateArticleOnly(words, settings)

        // 1. Verify Request Prompt
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        const systemPrompt = body.messages[0].content

        expect(systemPrompt).toContain('Word Study Analysis')
        expect(systemPrompt).toContain('Meaning in Context')
        expect(systemPrompt).toContain('ignite') // Check for the specific example used in prompt

        // 2. Verify Response Parsing
        expect(result.word_study).toHaveLength(1)
        expect(result.word_study![0].meaning_in_context).toBe('点燃')
    })
})
