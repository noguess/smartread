
import { describe, it, expect, vi } from 'vitest'
import { mockLLMService } from './mockLLMService'

describe('mockLLMService', () => {
    it('analyzes sentence with streaming simulation', async () => {
        const onToken = vi.fn()
        const sentence = 'Hello World'
        // cast to any since analyzeSentence is not yet in the interface but we are testing for it
        const result = await (mockLLMService as any).analyzeSentence(sentence, { apiKey: 'mock' }, onToken)

        expect(onToken).toHaveBeenCalled()
        expect(result).toContain('Mock Analysis')
        expect(result).toContain(sentence)
    })
})
