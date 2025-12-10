import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReadingPage from './ReadingPage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { articleService } from '../services/articleService'
import { wordService } from '../services/wordService'
import { quizRecordService } from '../services/quizRecordService'
import { settingsService } from '../services/settingsService'

// Component Mocks
vi.mock('../components/reading/ArticleContent', () => ({ default: () => <div data-testid="article-content">Article Content</div> }))
vi.mock('../components/reading/ReadingProgressBar', () => ({ default: () => <div data-testid="progress-bar" /> }))
vi.mock('../components/reading/ReadingTimer', () => ({ default: () => <div data-testid="reading-timer" /> }))

// Service Mocks
vi.mock('../services/articleService')
vi.mock('../services/wordService')
vi.mock('../services/quizRecordService')
vi.mock('../services/settingsService')
vi.mock('canvas-confetti', () => ({
    __esModule: true,
    default: Object.assign(vi.fn(), { create: vi.fn(() => ({ reset: vi.fn() })) }),
    create: vi.fn(() => ({ reset: vi.fn() }))
}))
vi.mock('../components/common/ConfettiEffect', () => ({ default: () => null }))

vi.mock('../services/llmService', () => ({ llmService: { generateQuizForArticle: vi.fn() } }))
vi.mock('../services/mockLLMService', () => ({
    mockLLMService: {
        generateQuizForArticle: vi.fn().mockResolvedValue({
            readingQuestions: [{ id: 'q1', answer: 'A', stem: 'Question 1' }],
            vocabularyQuestions: [{ id: 'v1', answer: 'B', stem: 'Question 2', targetWord: 'word' }]
        })
    }
}))

vi.mock('../components/reading/QuizView', () => ({
    default: ({ onSubmit, onExit, readOnly, result, isSubmitting }: any) => (
        <div data-testid="quiz-view">
            {readOnly ? (
                <>
                    <span>Review Mode</span>
                    {result && (
                        <>
                            <span data-testid="result-score">{result.score}</span>
                            {result.stats && (
                                <div data-testid="result-stats">
                                    <span data-testid="reading-stats">
                                        {result.stats.reading.correct}/{result.stats.reading.total}
                                    </span>
                                    <span data-testid="vocab-stats">
                                        {result.stats.vocabulary.correct}/{result.stats.vocabulary.total}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                    <button onClick={onExit}>Exit Review</button>
                </>
            ) : (
                <button
                    onClick={() => onSubmit({ reading: { 'q1': 'A' }, vocabulary: { 'v1': 'B' } })}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
            )}
        </div>
    )
}))

// I18n Mock
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

describe('ReadingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default mocks
        vi.mocked(settingsService.getSettings).mockResolvedValue({ difficultyLevel: 'L2' } as any)
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue({ id: 1, spelling: 'word', status: 'New' } as any)
        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([])
    })

    const renderWithRouter = (path: string = '/read/1') => {
        return render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/read/:id" element={<ReadingPage />} />
                    <Route path="/" element={<div>Home</div>} />
                </Routes>
            </MemoryRouter>
        )
    }

    it('shows initializing spinner initially for ID route', async () => {
        // Delay the promise to check spinner
        let resolveArticle: (val: any) => void
        const articlePromise = new Promise(r => { resolveArticle = r })
        vi.mocked(articleService.getById).mockReturnValue(articlePromise as any)

        renderWithRouter('/read/123')

        // Should see CircularProgress (MUI uses role 'progressbar')
        // We mocked CircularProgress? No, but we can search for it by role
        expect(screen.getByRole('progressbar')).toBeInTheDocument()

        resolveArticle!({
            id: 123,
            uuid: 'uuid-123',
            title: 'Test Title',
            content: 'Test Content',
            targetWords: []
        })

        await waitFor(() => {
            expect(screen.getByTestId('article-content')).toBeInTheDocument()
        })
    })

    it('renders sidebar history correctly', async () => {
        const mockArticle = {
            id: 1,
            uuid: 'a-uuid-1',
            title: 'Title',
            content: 'Content',
            targetWords: ['word1']
        }
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle as any)

        const mockRecords = [
            { id: 101, date: 1733644800000, score: 95 } // 2024-12-08 ...
        ]
        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue(mockRecords as any)

        renderWithRouter('/read/1')

        await waitFor(() => {
            expect(screen.getByText('reading:sidebar.quizHistory')).toBeInTheDocument()
            expect(screen.getByText('95')).toBeInTheDocument()
        })
    })

    it('renders Word Study info in Sidebar when data is available', async () => {
        const mockArticle = {
            id: 2,
            uuid: 'uuid-2',
            title: 'Word Study Article',
            content: 'Content...',
            targetWords: ['light'],
            wordCtxMeanings: [
                { word: 'light', part_of_speech: 'v.', meaning_in_context: '点燃' }
            ]
        }
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle as any)

        renderWithRouter('/read/2')

        await waitFor(() => {
            // Check content is rendered (now in Sidebar)
            expect(screen.getByText('点燃')).toBeInTheDocument()
            expect(screen.getByText('light')).toBeInTheDocument()
            expect(screen.getByText('v.')).toBeInTheDocument()
        })
    })

    it('displays correct difficulty label based on article data', async () => {
        const mockArticle = {
            id: 3,
            uuid: 'uuid-3',
            title: 'Difficulty Test',
            content: 'Content...',
            targetWords: [],
            difficultyLevel: 'L3'
        }
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle as any)

        renderWithRouter('/read/3')

        await waitFor(() => {
            expect(screen.getByText('reading:sidebar.advanced')).toBeInTheDocument()
        })
    })

    it.skip('transitions directly to Review mode with result upon submission', async () => {
        const mockArticle = {
            id: 4,
            uuid: 'uuid-4',
            title: 'Quiz Flow Test',
            content: 'Content',
            targetWords: []
        }
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle as any)

        renderWithRouter('/read/4')

        // Wait for article to load
        await waitFor(() => {
            expect(screen.getByTestId('article-content')).toBeInTheDocument()
        })

        // Start Quiz
        const startBtn = screen.getByText('reading:buttons.startQuiz')
        startBtn.click()

        // Wait for QuizView
        await waitFor(() => {
            expect(screen.getByTestId('quiz-view')).toBeInTheDocument()
        })

        // Submit Quiz
        const submitBtn = screen.getByText('Submit Quiz')
        submitBtn.click()

        // Expect to be in Review Mode immediately
        await waitFor(() => {
            expect(screen.getByText('Review Mode')).toBeInTheDocument()
        })

        // Expect Result Score 100
        expect(screen.getByTestId('result-score')).toHaveTextContent('100')

        // Expect Quiz Record Saved
        expect(quizRecordService.saveQuizRecord).toHaveBeenCalled()
    })

    it('calculates and passes detailed stats to QuizView', async () => {
        const mockArticle = {
            id: 5,
            uuid: 'uuid-5',
            title: 'Stats Test',
            content: 'Content',
            targetWords: []
        }
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle as any)

        renderWithRouter('/read/5')

        await waitFor(() => expect(screen.getByTestId('article-content')).toBeInTheDocument())

        // Start Quiz
        const startBtn = screen.getByText('reading:buttons.startQuiz')
        startBtn.click()

        await waitFor(() => expect(screen.getByTestId('quiz-view')).toBeInTheDocument())

        // Submit Quiz
        const submitBtn = screen.getByText('Submit Quiz')
        submitBtn.click()

        await waitFor(() => expect(screen.getByText('Review Mode')).toBeInTheDocument())

        // Verify Stats
        expect(screen.getByTestId('reading-stats')).toHaveTextContent('1/1')
        expect(screen.getByTestId('vocab-stats')).toHaveTextContent('1/1')
    })

    it('shows loading state on submit and scrolls to top on result', async () => {
        const mockArticle = {
            id: 6,
            uuid: 'uuid-6',
            title: 'Interaction Test',
            content: 'Content',
            targetWords: [{ id: 100, spelling: 'word', status: 'New' }]
        }
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle as any)

        // Mock scrollTo
        const scrollToSpy = vi.fn()
        window.scrollTo = scrollToSpy

        renderWithRouter('/read/6')

        await waitFor(() => expect(screen.getByTestId('article-content')).toBeInTheDocument())

        // Start Quiz
        const startBtn = screen.getByText('reading:buttons.startQuiz')
        startBtn.click()

        await waitFor(() => expect(screen.getByTestId('quiz-view')).toBeInTheDocument())

        // Submit Quiz
        const submitBtn = screen.getByText('Submit Quiz')

        // Mock a slow update
        vi.mocked(wordService.updateWord).mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 100))
        })

        submitBtn.click()

        // Check for loading state immediately
        await waitFor(() => {
            expect(screen.getByText('Submitting...')).toBeInTheDocument()
        })

        // Check for transition to Review Mode
        await waitFor(() => {
            expect(screen.getByText('Review Mode')).toBeInTheDocument()
        })

        // Check for scroll to top
        expect(scrollToSpy).toHaveBeenCalledWith(0, 0)
    })
})
