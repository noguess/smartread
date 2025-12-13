import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ReadingSidebar } from './ReadingSidebars'
import { Word, QuizRecord } from '../../services/db'
import { MemoryRouter } from 'react-router-dom'

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
    Highlight: () => <span data-testid="icon-highlighter">Highlighter</span>,
    EmojiEvents: () => <span data-testid="icon-trophy">Trophy</span>,
    ArrowForward: () => <span data-testid="icon-arrow-right">ArrowRight</span>,
    History: () => <span data-testid="icon-history">History</span>,
}))

const mockWords = [
    { id: 1, spelling: 'lonely', status: 'new' } as Word,
    { id: 2, spelling: 'habit', status: 'learning' } as Word,
]

const mockHistory = [
    { id: 101, score: 85, date: 1700000000000 } as QuizRecord,
    { id: 102, score: 60, date: 1690000000000 } as QuizRecord,
]

const defaultProps = {
    words: mockWords,
    activeWord: null,
    onHoverWord: vi.fn(),
    quizHistory: mockHistory,
    onStartQuiz: vi.fn(),
    onReviewQuiz: vi.fn(),
}

describe('ReadingSidebar', () => {
    it('renders vocab list logic correctly', () => {
        render(
            <MemoryRouter>
                <ReadingSidebar {...defaultProps} />
            </MemoryRouter>
        )
        expect(screen.getByText('lonely')).toBeInTheDocument()
        expect(screen.getByText('habit')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument() // Count badge logic
    })

    it('triggers onHoverWord', () => {
        render(
            <MemoryRouter>
                <ReadingSidebar {...defaultProps} />
            </MemoryRouter>
        )
        const wordItem = screen.getByText('lonely').closest('div')
        fireEvent.mouseEnter(wordItem!)
        expect(defaultProps.onHoverWord).toHaveBeenCalledWith('lonely')
    })

    it('renders start quiz card', () => {
        render(
            <MemoryRouter>
                <ReadingSidebar {...defaultProps} />
            </MemoryRouter>
        )
        expect(screen.getByText('Start Quiz')).toBeInTheDocument()
    })

    it('renders history logic', () => {
        render(
            <MemoryRouter>
                <ReadingSidebar {...defaultProps} />
            </MemoryRouter>
        )
        expect(screen.getByText('85')).toBeInTheDocument()
    })

    it('calls onStartQuiz', () => {
        render(
            <MemoryRouter>
                <ReadingSidebar {...defaultProps} />
            </MemoryRouter>
        )
        // Icon is mocked as <span data-testid="icon-arrow-right">
        const startBtn = screen.getByTestId('icon-arrow-right').closest('button')
        fireEvent.click(startBtn!)
        expect(defaultProps.onStartQuiz).toHaveBeenCalled()
    })
})
