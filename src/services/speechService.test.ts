import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SpeechService } from './speechService'

describe('SpeechService', () => {
    let mockRecognition: any
    let service: SpeechService

    beforeEach(async () => {
        mockRecognition = {
            start: vi.fn(),
            stop: vi.fn(),
            abort: vi.fn(),
            lang: '',
            continuous: false,
            interimResults: false,
            onresult: null,
            onerror: null,
            onend: null
        }

        vi.stubGlobal('webkitSpeechRecognition', vi.fn().mockImplementation(function (this: any) {
            return mockRecognition
        }))
        service = new SpeechService()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
    })

    it('should be supported if browser has webkitSpeechRecognition', () => {
        expect(service.isSupported()).toBe(true)
    })

    it('startListening should configure recognition and call start', () => {
        const onResult = vi.fn()
        service.startListening('en-US', onResult)

        expect(mockRecognition.lang).toBe('en-US')
        expect(mockRecognition.start).toHaveBeenCalled()
    })

    it('should handle onresult event and trigger callback', () => {
        const onResult = vi.fn()
        service.startListening('en-US', onResult)

        // Simulate event
        const mockEvent = {
            results: [
                {
                    0: { transcript: 'hello', confidence: 0.9 },
                    isFinal: true
                }
            ],
            length: 1
        }

        mockRecognition.onresult(mockEvent)

        expect(onResult).toHaveBeenCalledWith({
            transcript: 'hello',
            isFinal: true,
            confidence: 0.9
        })
    })

    it('should handle errors and trigger error callback', () => {
        const onResult = vi.fn()
        const onError = vi.fn()
        service.startListening('en-US', onResult, onError)

        mockRecognition.onerror({ error: 'not-allowed' })

        expect(onError).toHaveBeenCalledWith('Microphone permission denied')
    })

    it('should abort current session if startListening is called while already listening', () => {
        service.startListening('en-US', vi.fn())
        service.startListening('zh-CN', vi.fn())

        expect(mockRecognition.abort).toHaveBeenCalled()
    })
})
