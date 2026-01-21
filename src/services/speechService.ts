/**
 * Speech Recognition Service
 * Wraps the browser's SpeechRecognition API to provide a stable interface
 * for both English and Chinese speech recognition.
 */

// Define SpeechRecognition types since they might not be standard in all TS configs
interface ISpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onresult: (event: any) => void
    onerror: (event: any) => void
    onend: () => void
}

interface ISpeechRecognitionEvent {
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string
                confidence: number
            }
            isFinal: boolean
        }
        length: number
    }
}

// Global declaration for window
declare global {
    interface Window {
        SpeechRecognition: any
        webkitSpeechRecognition: any
    }
}

export type SpeechLang = 'en-US' | 'zh-CN'

export interface SpeechResult {
    transcript: string
    isFinal: boolean
    confidence: number
}

type SpeechCallback = (result: SpeechResult) => void
type ErrorCallback = (error: string) => void

export class SpeechService {
    private recognition: ISpeechRecognition | null = null
    private isListening: boolean = false
    private onResultCallback: SpeechCallback | null = null
    private onErrorCallback: ErrorCallback | null = null

    constructor() {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition()
                this.setuprecognition()
            }
        }
    }

    private setuprecognition() {
        if (!this.recognition) return

        this.recognition.continuous = false // We want short bursts for drills
        this.recognition.interimResults = true

        this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
            if (!this.onResultCallback) return

            const results = event.results
            const lastResult = results[results.length - 1]
            const text = lastResult[0].transcript
            const confidence = lastResult[0].confidence
            const isFinal = lastResult.isFinal

            this.onResultCallback({
                transcript: text,
                isFinal,
                confidence
            })
        }

        this.recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error)
            this.isListening = false
            if (this.onErrorCallback) {
                // Map browser errors to user friendly messages
                let msg = event.error
                if (msg === 'not-allowed') msg = 'Microphone permission denied'
                if (msg === 'no-speech') msg = 'No speech detected'
                this.onErrorCallback(msg)
            }
        }

        this.recognition.onend = () => {
            this.isListening = false
        }
    }

    public isSupported(): boolean {
        return !!this.recognition
    }

    public startListening(
        lang: SpeechLang,
        onResult: SpeechCallback,
        onError?: ErrorCallback
    ) {
        if (!this.recognition) {
            onError?.('Speech recognition not supported')
            return
        }

        if (this.isListening) {
            this.recognition.abort()
        }

        this.recognition.lang = lang
        this.onResultCallback = onResult
        this.onErrorCallback = onError || null

        try {
            this.recognition.start()
            this.isListening = true
        } catch (e) {
            console.error('Failed to start recognition', e)
            onError?.('Failed to start microphone')
        }
    }

    public stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop()
            this.isListening = false
        }
    }

    public abort() {
        if (this.recognition) {
            this.recognition.abort()
            this.isListening = false
        }
    }
}

export const speechService = new SpeechService()
