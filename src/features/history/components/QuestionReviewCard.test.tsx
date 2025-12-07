
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import QuestionReviewCard, { QuestionData } from './QuestionReviewCard'

// Mock translation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, def?: string) => def || key })
}))

describe('QuestionReviewCard', () => {
    const mockQuestion: QuestionData = {
        id: 'q1',
        type: 'choice',
        stem: 'What is 2+2?',
        options: ['3', '4', '5'],
        answer: '4',
        explanation: 'Math is fun.'
    }

    it('renders question stem and options', () => {
        render(<QuestionReviewCard question={mockQuestion} userAnswer={null} index={0} />)
        expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
        expect(screen.getByText(/A\. 3/)).toBeInTheDocument()
        expect(screen.getByText(/B\. 4/)).toBeInTheDocument()
    })

    it('highlights correct user answer', () => {
        render(<QuestionReviewCard question={mockQuestion} userAnswer="4" index={0} />)
        // Check if there is success styling or specific text indicating correct
        expect(screen.getByText(/Your Answer/i)).toBeInTheDocument()
    })

    it('highlights incorrect user answer', () => {
        render(<QuestionReviewCard question={mockQuestion} userAnswer="3" index={0} />)
        expect(screen.getByText(/A. 3/)).toHaveStyle({ fontWeight: 700 }) // Bold for user selected
        // We can check for color or specific text patterns if implemented
    })

    it('displays explanation when accordion is expanded', () => {
        render(<QuestionReviewCard question={mockQuestion} userAnswer="4" index={0} />)

        // Explanation should be hidden initially (or just check existence in document but not visible - typically hidden content is still in DOM but invisible)
        // But Material UI Accordion Details might not be rendered in DOM until expanded if unmounted.
        // Let's assume it renders but is hidden. Checking full text content.

        // Click to expand
        const expandButton = screen.getByRole('button', { expanded: false })
        fireEvent.click(expandButton)

        expect(screen.getByText('Math is fun.')).toBeInTheDocument()
    })

    it('renders text input type questions correctly', () => {
        const textQuestion: QuestionData = {
            id: 'q2',
            type: 'spelling',
            stem: 'Spell "hello"',
            answer: 'hello',
            explanation: 'h-e-l-l-o'
        }

        render(<QuestionReviewCard question={textQuestion} userAnswer="hello" index={1} />)
        expect(screen.queryByText(/^A\./)).not.toBeInTheDocument() // No options
        expect(screen.getByText('Your Answer: hello')).toBeInTheDocument()
    })
})
