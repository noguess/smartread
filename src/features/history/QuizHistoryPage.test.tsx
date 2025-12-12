import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QuizHistoryPage from './QuizHistoryPage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { quizRecordService } from '../../services/quizRecordService'
import { articleService } from '../../services/articleService'

// Service Mocks
vi.mock('../../services/quizRecordService')
vi.mock('../../services/articleService')

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

// I18n Mock
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

const mockRecords = [
    {
        id: 1,
        articleId: 'uuid-1',
        score: 80,
        timeSpent: 100,
        date: new Date('2023-01-01T10:00:00Z').getTime(),
        questions: { reading: [], vocabulary: [] }, // Minimal valid shape
        userAnswers: {},
        difficultyFeedback: 'appropriate'
    }
]

const mockArticles = [
    {
        id: 1,
        uuid: 'uuid-1',
        title: 'Test Article',
        difficultyLevel: 'L1',
        createdAt: Date.now(),
        targetWords: [],
        source: 'generated',
        content: 'content'
    }
]

describe('QuizHistoryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(quizRecordService.getAll).mockResolvedValue([])
        vi.mocked(articleService.getAll).mockResolvedValue([])
    })

    const renderWithRouter = (state?: any) => {
        return render(
            <MemoryRouter initialEntries={[{ pathname: '/history', state }]}>
                <Routes>
                    <Route path="/history" element={<QuizHistoryPage />} />
                </Routes>
            </MemoryRouter>
        )
    }

    it('renders list of history records', async () => {
        vi.mocked(quizRecordService.getAll).mockResolvedValue(mockRecords as any)
        vi.mocked(articleService.getAll).mockResolvedValue(mockArticles as any)

        render(
            <MemoryRouter>
                <QuizHistoryPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            // Check for new Card style content
            expect(screen.getByText('Test Article')).toBeInTheDocument()
            expect(screen.getByText('L1')).toBeInTheDocument()
            expect(screen.getByText('80')).toBeInTheDocument()
        })
    })

    it('navigates to review page on click', async () => {
        vi.mocked(quizRecordService.getAll).mockResolvedValue(mockRecords as any)
        vi.mocked(articleService.getAll).mockResolvedValue(mockArticles as any)

        render(
            <MemoryRouter>
                <QuizHistoryPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Test Article')).toBeInTheDocument()
        })

        // Click the Review button on the card
        const reviewBtn = screen.getAllByText('history:review')[0]
        fireEvent.click(reviewBtn)

        expect(mockNavigate).toHaveBeenCalledWith('/history/1')
    })

    it('shows empty state when no records exist', async () => {
        vi.mocked(quizRecordService.getAll).mockResolvedValue([])
        vi.mocked(articleService.getAll).mockResolvedValue([])

        render(
            <MemoryRouter>
                <QuizHistoryPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('history:noRecords')).toBeInTheDocument()
            expect(screen.getByText('history:startPrompt')).toBeInTheDocument()
        })
    })

    it('shows snackbar error from navigation state', async () => {
        const errorMsg = 'Failed to load review'
        renderWithRouter({ error: errorMsg })

        // Should see loading then empty state
        await waitFor(() => {
            expect(screen.getByText('history:noRecords')).toBeInTheDocument()
        })

        // Check for Snackbar Alert
        await waitFor(() => {
            // Material UI Alert usually has these roles
            expect(screen.getByRole('alert')).toHaveTextContent(errorMsg)
        })
    })
})
