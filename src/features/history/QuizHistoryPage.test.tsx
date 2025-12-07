import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QuizHistoryPage from './QuizHistoryPage'
import { quizRecordService } from '../../services/quizRecordService'
import { articleService } from '../../services/articleService'
import { BrowserRouter } from 'react-router-dom'

// Auto-mock dependencies
vi.mock('../../services/quizRecordService')
vi.mock('../../services/articleService')
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, ...args: any[]) => {
            const options = args[args.length - 1]
            return options?.count ? `Take #${options.count}` : key
        }
    })
}))

const mockRecords = [
    {
        id: 1,
        articleId: 'uuid-1',
        date: 1678886400000, // 2023-03-15
        score: 85,
        timeSpent: 125, // 2m 5s
        questions: {},
        userAnswers: {},
        difficultyFeedback: 3
    }
]

const mockArticles = [
    {
        id: 1,
        uuid: 'uuid-1',
        title: 'Test Article',
        content: 'Content',
        targetWords: [],
        difficultyLevel: 'L2',
        createdAt: 1678800000000,
        source: 'generated'
    }
]

const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('QuizHistoryPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('renders loading state initially', () => {
        // Return pending promise to simulate loading
        vi.mocked(quizRecordService.getAll).mockReturnValue(new Promise(() => { }))
        vi.mocked(articleService.getAll).mockReturnValue(new Promise(() => { }))

        renderWithRouter(<QuizHistoryPage />)
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('renders empty state when no records', async () => {
        vi.mocked(quizRecordService.getAll).mockResolvedValue([])
        vi.mocked(articleService.getAll).mockResolvedValue([])

        renderWithRouter(<QuizHistoryPage />)

        await waitFor(() => {
            expect(screen.getByText('history:noRecords')).toBeInTheDocument()
        })
    })

    it('renders records with article details', async () => {
        vi.mocked(quizRecordService.getAll).mockResolvedValue(mockRecords)
        vi.mocked(articleService.getAll).mockResolvedValue(mockArticles as any)

        renderWithRouter(<QuizHistoryPage />)

        await waitFor(() => {
            // Check Title
            expect(screen.getByText('Test Article')).toBeInTheDocument()
        })

        // Check Score
        expect(screen.getByText('85')).toBeInTheDocument()
        // Check Difficulty Chip
        expect(screen.getByText('L2')).toBeInTheDocument()
        // Check Attempt Count
        expect(screen.getByText('Take #1')).toBeInTheDocument()
        // Check Duration (125s -> 2m 5s) - using getByText with exact match might fail if split, but "2m 5s" is distinct
        expect(screen.getByText('2m 5s')).toBeInTheDocument()
    })

    it('handles unknown article gracefully', async () => {
        const recordsUnknown = [{ ...mockRecords[0], articleId: 'uuid-unknown' }]
        vi.mocked(quizRecordService.getAll).mockResolvedValue(recordsUnknown)
        vi.mocked(articleService.getAll).mockResolvedValue(mockArticles as any)

        renderWithRouter(<QuizHistoryPage />)

        await waitFor(() => {
            expect(screen.getByText('common:unknownArticle')).toBeInTheDocument()
        })
        expect(screen.getByText('Take #1')).toBeInTheDocument()
    })
})
