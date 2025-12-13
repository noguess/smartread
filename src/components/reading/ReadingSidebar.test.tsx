import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReadingSidebar } from './ReadingSidebars'
import { QuizRecord, Word } from '../../services/db'

// Mock useTranslation
import { vi } from 'vitest'
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            if (key === 'reading:sidebar.quizStats') {
                return `Count: ${options.count}, Best: ${options.score}`
            }
            return key
        }
    })
}))

describe('ReadingSidebar Score Calculation', () => {
    const mockProps = {
        words: [] as Word[],
        activeWord: null,
        onHoverWord: () => { },
        quizHistory: [],
        onStartQuiz: () => { },
        onReviewQuiz: () => { },
        wordContexts: []
    }

    it('handles NaN score in history gracefully', () => {
        const corruptHistory: QuizRecord[] = [
            { id: 1, articleId: 'u1', date: 100, questions: {} as any, score: 80 },
            { id: 2, articleId: 'u1', date: 200, questions: {} as any, score: "NaN" as any }, // String "NaN" is truthy!
            { id: 3, articleId: 'u1', date: 300, questions: {} as any, score: 50 },
        ]

        render(<ReadingSidebar {...mockProps} quizHistory={corruptHistory} />)

        // We expect Best: 80, not Best: NaN
        // Current buggy implementation likely shows Best: NaN because Math.max(80, NaN, 50) is NaN
        expect(screen.getByText(/Best: 80/)).toBeInTheDocument()
    })
    it('calculates best score correctly for valid data', () => {
        const history: QuizRecord[] = [
            { id: 1, articleId: 'u1', date: 100, questions: {} as any, score: 80 },
            { id: 2, articleId: 'u1', date: 200, questions: {} as any, score: 95 },
            { id: 3, articleId: 'u1', date: 300, questions: {} as any, score: 60 },
        ]

        render(<ReadingSidebar {...mockProps} quizHistory={history} />)
        expect(screen.getByText(/Best: 95/)).toBeInTheDocument()
    })
})
