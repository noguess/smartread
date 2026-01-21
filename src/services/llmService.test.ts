
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
            json: vi.fn().mockResolvedValue({
                choices: [{ message: { content: '{}' } }]
            })
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

    it('analyzeSentence uses streaming when onToken is provided', async () => {
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: 'S' } }] }) + '\n\n'))
                controller.enqueue(encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: 't' } }] }) + '\n\n'))
                controller.close()
            }
        })
        const mockResponse = {
            ok: true,
            body: stream
        }
        mockFetch.mockResolvedValue(mockResponse)

        const onToken = vi.fn()
        await llmService.analyzeSentence("Test sentence.", { apiKey: 'test' } as any, onToken)

        expect(onToken).toHaveBeenCalledTimes(2)
        expect(onToken).toHaveBeenNthCalledWith(1, 'S')
        expect(onToken).toHaveBeenNthCalledWith(2, 't')

        // callback body should have stream: true
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.stream).toBe(true)
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
            json: vi.fn().mockResolvedValue({
                choices: [{ message: { content: JSON.stringify(mockResponseData) } }]
            })
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

    it('generateQuizForArticle injects IDs if missing', async () => {
        // Mock Response with questions missing IDs
        const mockQuizData = {
            readingQuestions: [
                { question: "Q1", answer: "A" }, // Missing ID, using 'question' instead of 'stem'
                { question: "Q2", answer: "B", id: "existing_r2" }
            ],
            vocabularyQuestions: [
                { question: "V1", answer: "A" }, // Missing ID
                { question: "V2", answer: "B" }
            ]
        }

        const mockResponse = {
            ok: true,
            headers: { get: () => '1000' },
            json: vi.fn().mockResolvedValue({
                choices: [{ message: { content: JSON.stringify(mockQuizData) } }]
            })
        }
        mockFetch.mockResolvedValue(mockResponse)

        const words = [{ spelling: 'test', meaning: '测试' }] as any
        const settings = { apiKey: 'test', difficultyLevel: 'L2' } as any

        const result = await llmService.generateQuizForArticle("Content", words, settings)

        // Verify IDs were injected
        expect(result.readingQuestions[0].id).toBe('r0')
        expect(result.readingQuestions[1].id).toBe('existing_r2')

        expect(result.vocabularyQuestions[0].id).toBe('v0')
        expect(result.vocabularyQuestions[1].id).toBe('v1')

        // Verify Stem Normalization (question -> stem)
        expect(result.readingQuestions[0].stem).toBe('Q1')
        expect(result.vocabularyQuestions[0].stem).toBe('V1')
    })

    describe('_callDeepSeekStream', () => {
        it('streams response chunks via onToken callback', async () => {
            const encoder = new TextEncoder()
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: 'Hello' } }] }) + '\n\n'))
                    controller.enqueue(encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: ' World' } }] }) + '\n\n'))
                    controller.close()
                }
            })

            const mockResponse = {
                ok: true,
                body: stream
            }
            mockFetch.mockResolvedValue(mockResponse)

            const onToken = vi.fn()

            await (llmService as any)._callDeepSeekStream(
                'test-key',
                '/api',
                'sys',
                'user',
                onToken
            )

            expect(onToken).toHaveBeenCalledTimes(2)
            expect(onToken).toHaveBeenNthCalledWith(1, 'Hello')
            expect(onToken).toHaveBeenNthCalledWith(2, ' World')
        })
    })

    describe('gradeTranslation', () => {
        it('sends correct prompt and parses response', async () => {
            const mockGradeData = { score: 95, feedback: "Perfect" }
            const mockResponse = {
                ok: true,
                headers: { get: () => '1000' },
                json: vi.fn().mockResolvedValue({
                    choices: [{ message: { content: JSON.stringify(mockGradeData) } }]
                })
            }
            mockFetch.mockResolvedValue(mockResponse)

            const result = await llmService.gradeTranslation(
                "apple",
                "I ate an apple.",
                "我吃了一个苹果",
                { apiKey: 'test' } as any
            )

            expect(result.score).toBe(95)
            expect(result.feedback).toBe("Perfect")

            const callArgs = mockFetch.mock.calls[0]
            const body = JSON.parse(callArgs[1].body)
            expect(body.messages[0].content).toContain('英汉双语专家')
            expect(body.messages[1].content).toContain('Word: "apple"')
        })

        it('batchGradeTranslations sends list and parses array', async () => {
            const mockBatchData = [
                { word: "apple", score: 90, feedback: "Good" },
                { word: "banana", score: 85, feedback: "Fine" }
            ]
            const mockResponse = {
                ok: true,
                headers: { get: () => '1000' },
                json: vi.fn().mockResolvedValue({
                    choices: [{ message: { content: JSON.stringify(mockBatchData) } }]
                })
            }
            mockFetch.mockResolvedValue(mockResponse)

            const result = await llmService.batchGradeTranslations(
                [
                    { word: "apple", userInput: "苹果" },
                    { word: "banana", userInput: "香蕉" }
                ],
                { apiKey: 'test' } as any
            )

            expect(result).toHaveLength(2)
            expect(result[0].score).toBe(90)
            expect(mockFetch).toHaveBeenCalledTimes(1)
            const body = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(body.messages[0].content).toContain('批量评估')
        })
    })
})
