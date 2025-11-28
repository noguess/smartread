import { Word } from './db'

export interface Question {
    id: string
    type: 'choice' | 'cloze'
    stem: string
    options: string[]
    answer: string // The correct option text
}

export interface GeneratedContent {
    title: string
    content: string
    questions: Question[]
}

export const mockLLMService = {
    async generateArticle(words: Word[], length: string = 'medium'): Promise<GeneratedContent> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const wordList = words.map((w) => w.spelling).join(', ')
        const targetWord = words[0]?.spelling || 'apple'

        return {
            title: 'A Journey of Learning',
            content: `
This is a **mock** article generated for testing purposes. 
It is designed to help you learn the following words: **${wordList}**.

One day, a student decided to learn about **${targetWord}**. 
It was a fascinating journey. The **${targetWord}** was very important.

The end.
      `.trim(),
            questions: [
                {
                    id: 'q1',
                    type: 'choice',
                    stem: `What is the main topic of this article?`,
                    options: ['Learning words', 'Space travel', 'Cooking', 'History'],
                    answer: 'Learning words',
                },
                {
                    id: 'q2',
                    type: 'choice',
                    stem: `Which word was specifically mentioned as important?`,
                    options: ['Banana', targetWord, 'Orange', 'Grape'],
                    answer: targetWord,
                },
            ],
        }
    },
}
