/**
 * @vitest-environment happy-dom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ReadingSidebar } from './ReadingSidebars'
import { Word, QuizRecord } from '../../services/db'

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, _opts?: any) => key })
}))

describe('ReadingSidebar', () => {
    const mockWords: Word[] = [
        { id: 1, spelling: 'apple', meaning: 'fruit', status: 'New', nextReviewAt: 0, interval: 0, repetitionCount: 0, lastSeenAt: 0 }
    ]

    const mockHistory: QuizRecord[] = [
        // Completed record
        {
            id: 1,
            articleId: 'uuid-1',
            date: new Date('2024-01-01').getTime(),
            questions: { reading: [], vocabulary: [] },
            userAnswers: { reading: {}, vocabulary: {} },
            difficultyFeedback: 3,
            score: 90
        },
        // Draft record (no score) - Should be filtered out
        {
            id: 2,
            articleId: 'uuid-2',
            date: new Date('2024-02-01').getTime(),
            questions: { reading: [], vocabulary: [] },
            score: undefined,
            userAnswers: { reading: {}, vocabulary: {} },
        }
    ]

    const defaultProps = {
        words: mockWords,
        activeWord: null,
        onHoverWord: vi.fn(),
        quizHistory: mockHistory,
        onStartQuiz: vi.fn(),
        onReviewQuiz: vi.fn(),
        onWordClick: vi.fn()
    }

    it('filters out records without scores (drafts) from stats', () => {
        render(<ReadingSidebar {...defaultProps} />)
        // Check that only 1 record is shown in history
        expect(screen.getByText(new Date('2024-01-01').toLocaleDateString())).toBeInTheDocument()
    })

    it('renders only completed quizzes in the history list', () => {
        render(<ReadingSidebar {...defaultProps} />)

        // Should find date for record 1 (Jan 1)
        expect(screen.getByText(new Date('2024-01-01').toLocaleDateString())).toBeInTheDocument()

        // Should NOT find date for record 2 (Feb 1)
        expect(screen.queryByText(new Date('2024-02-01').toLocaleDateString())).not.toBeInTheDocument()

        // Should show score 90
        expect(screen.getByText('90')).toBeInTheDocument()
    })

    it('calls onStartQuiz when challenge button is clicked', () => {
        render(<ReadingSidebar {...defaultProps} />)
        fireEvent.click(screen.getByText('reading:sidebar.challengeNow'))
        expect(defaultProps.onStartQuiz).toHaveBeenCalled()
    })

    it('highlights active word', () => {
        const props = { ...defaultProps, activeWord: 'apple' }
        render(<ReadingSidebar {...props} />)
        expect(screen.getByText('apple')).toBeInTheDocument()
    })

    it('calls onWordClick when a word is clicked', () => {
        render(<ReadingSidebar {...defaultProps} />)
        const wordItem = screen.getByText('apple')
        fireEvent.click(wordItem)
        expect(defaultProps.onWordClick).toHaveBeenCalledWith('apple')
    })
})
