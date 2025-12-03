/**
 * TTS (Text-to-Speech) Service
 * 使用浏览器原生 Web Speech API 实现单词发音功能
 */

class TTSService {
    private synthesis: SpeechSynthesis | null = null
    private utterance: SpeechSynthesisUtterance | null = null

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis
        }
    }

    /**
     * 播放单词发音
     * @param word 要朗读的单词
     * @param phonetic 音标（可选，用于记录但不直接使用）
     * @param lang 语言代码，默认美式英语
     */
    playWord(word: string, phonetic?: string, lang: string = 'en-US'): void {
        if (!this.synthesis) {
            console.warn('Speech Synthesis not supported in this browser')
            return
        }

        // 停止当前正在播放的语音
        this.stop()

        // 创建新的语音
        this.utterance = new SpeechSynthesisUtterance(word)
        this.utterance.lang = lang
        this.utterance.rate = 0.8 // 稍慢，便于听清
        this.utterance.pitch = 1.0
        this.utterance.volume = 1.0

        // 播放
        this.synthesis.speak(this.utterance)

        console.log(`Playing word: "${word}"${phonetic ? ` (${phonetic})` : ''}`)
    }

    /**
     * 停止当前播放
     */
    stop(): void {
        if (this.synthesis) {
            this.synthesis.cancel()
        }
    }

    /**
     * 检查TTS是否可用
     */
    isSupported(): boolean {
        return this.synthesis !== null
    }

    /**
     * 获取可用的语音列表
     */
    getVoices(): SpeechSynthesisVoice[] {
        if (!this.synthesis) return []
        return this.synthesis.getVoices()
    }
}

// 导出单例
export const ttsService = new TTSService()
