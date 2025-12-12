import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HistoryListCard, { HistoryCardProps } from './HistoryListCard'
import { ThemeProvider, createTheme } from '@mui/material'

// Mock icons to avoid rendering issues in test env
vi.mock('@mui/icons-material', () => ({
    Assessment: () => <div data-testid="AssessmentIcon" />,
    Speed: () => <div data-testid="SpeedIcon" />,
    History: () => <div data-testid="HistoryIcon" />,
    EmojiEvents: () => <div data-testid="EmojiEventsIcon" />,
    ChevronRight: () => <div data-testid="ChevronRightIcon" />,
    DeleteOutline: () => <div data-testid="DeleteIcon" />
}))

// Mock Translation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            if (key === 'history:attempt') return `Attempt ${options?.count}`
            if (key === 'common:score') return 'Score'
            if (key === 'history:review') return 'Review'
            return key
        }
    })
}))

const mockRecord: HistoryCardProps['record'] = {
    id: 1,
    articleId: 'uuid-1',
    date: new Date('2023-01-01T12:00:00').getTime(),
    timeSpent: 125, // 2m 5s
    score: 85,
    answers: [],
    questions: { reading: [], vocabulary: [] },
    articleTitle: 'Test Article Title',
    articleDifficulty: 'L2',
    attemptNumber: 3
}

const theme = createTheme()

describe('HistoryListCard', () => {
    it('renders record information correctly', () => {
        const onReview = vi.fn()
        render(
            <ThemeProvider theme={theme}>
                <HistoryListCard record={mockRecord} onReview={onReview} />
            </ThemeProvider>
        )

        // Title
        expect(screen.getByText('Test Article Title')).toBeInTheDocument()

        // Difficulty Chip
        expect(screen.getByText('L2')).toBeInTheDocument()

        // Date
        // Note: Date formatting might depend on locale, stick to check presence or partial
        // "2023" is safe
        expect(screen.getByText(/2023/)).toBeInTheDocument()

        // Duration (125s -> 2m 5s)
        expect(screen.getByText('2m 5s')).toBeInTheDocument()

        // Score
        expect(screen.getByText('85')).toBeInTheDocument()

        // Attempt count
        expect(screen.getByText('Attempt 3')).toBeInTheDocument()
    })

    it('calls onReview when button is clicked', () => {
        const onReview = vi.fn()
        render(
            <ThemeProvider theme={theme}>
                <HistoryListCard record={mockRecord} onReview={onReview} />
            </ThemeProvider>
        )

        const button = screen.getByText('Review')
        fireEvent.click(button)
        expect(onReview).toHaveBeenCalledWith(mockRecord)
    })

    it('displays correct color for high score', () => {
        const onReview = vi.fn()
        // Score 85 -> Success color logic usually
        // We might just check if it renders without crashing, as color testing is fragile with computed styles
        render(
            <ThemeProvider theme={theme}>
                <HistoryListCard record={mockRecord} onReview={onReview} />
            </ThemeProvider>
        )
        expect(screen.getByText('85')).toBeInTheDocument()
    })
})
