import { Word } from './db'

export interface Question {
    id: string
    type: 'cloze' | 'definition' | 'spelling' | 'contextual' | 'audio' | 'wordForm' | 'synonym' | 'matching' | 'spellingInput' | 'synonymAntonym' | 'audioDictation' | 'audioSelection'
    targetWord?: string
    stem: string
    options?: string[]
    answer: string | string[]
    audioUrl?: string
    phonetic?: string
    pairs?: { word: string; definition: string }[]
}

export interface GeneratedContent {
    title: string
    content: string
    readingQuestions: Question[]
    vocabularyQuestions: Question[]
}

export const mockLLMService = {
    async generateArticle(
        words: Word[],
        settings?: { difficultyLevel?: 'L1' | 'L2' | 'L3' },
        onProgress?: (progress: number) => void
    ): Promise<GeneratedContent> {
        // Reuse new methods
        const article = await this.generateArticleOnly(words, settings, (p) => onProgress?.(p * 0.5))
        const quiz = await this.generateQuizForArticle(article.content, words, settings, (p) => onProgress?.(50 + p * 0.5))

        return {
            title: article.title,
            content: article.content,
            readingQuestions: quiz.readingQuestions,
            vocabularyQuestions: quiz.vocabularyQuestions
        }
    },

    async generateArticleOnly(
        words: Word[],
        settings?: { difficultyLevel?: 'L1' | 'L2' | 'L3' },
        onProgress?: (progress: number) => void
    ): Promise<{ title: string; content: string; targetWords: string[] }> {
        // Simulate progressive loading
        await this._simulateProgress(onProgress)

        const difficultyLevel = settings?.difficultyLevel || 'L2'
        const wordList = words.map((w) => w.spelling).join(', ')

        return {
            title: `Mock Article - ${difficultyLevel}`,
            content: `This is a **mock** article generated for ${difficultyLevel} difficulty. 
It includes target words like **${words[0]?.spelling || 'word'}** and **${words[1]?.spelling || 'vocabulary'}**.
The content is designed to help you prepare for exams.

Current Word List: ${wordList}.
`,
            targetWords: words.map(w => w.spelling)
        }
    },

    async generateQuizForArticle(
        _articleContent: string,
        words: Word[],
        settings?: { difficultyLevel?: 'L1' | 'L2' | 'L3' },
        onProgress?: (progress: number) => void
    ): Promise<{ readingQuestions: Question[]; vocabularyQuestions: Question[] }> {
        // Simulate progressive loading
        await this._simulateProgress(onProgress)

        const difficultyLevel = settings?.difficultyLevel || 'L2'

        // Mock Questions
        const readingQuestions: Question[] = [
            {
                id: 'r1',
                type: 'contextual',
                stem: 'What is the main purpose of this article?',
                options: ['To inform', 'To entertain', 'To persuade', 'To confuse'],
                answer: 'To inform'
            },
            {
                id: 'r2',
                type: 'contextual',
                stem: `What difficulty level is this? (It is ${difficultyLevel})`,
                options: ['L1', 'L2', 'L3', 'None'],
                answer: difficultyLevel
            },
            {
                id: 'r3',
                type: 'contextual',
                stem: 'Which word is mentioned?',
                options: [words[0]?.spelling || 'A', 'B', 'C', 'D'],
                answer: words[0]?.spelling || 'A'
            },
            {
                id: 'r4',
                type: 'contextual',
                stem: 'Is this a mock test?',
                options: ['Yes', 'No', 'Maybe', 'Unknown'],
                answer: 'Yes'
            }
        ]

        const vocabularyQuestions: Question[] = words.map((w, i) => ({
            id: `v${i}`,
            type: 'definition',
            targetWord: w.spelling,
            stem: `What is the definition of ${w.spelling}?`,
            options: [`Definition of ${w.spelling}`, 'Wrong 1', 'Wrong 2', 'Wrong 3'],
            answer: `Definition of ${w.spelling}`
        }))

        return {
            readingQuestions,
            vocabularyQuestions
        }
    },

    async _simulateProgress(onProgress?: (p: number) => void) {
        const totalDuration = 1000
        const steps = 10
        for (let i = 0; i <= steps; i++) {
            onProgress?.(i * 10)
            await new Promise(r => setTimeout(r, totalDuration / steps))
        }
    },
}
