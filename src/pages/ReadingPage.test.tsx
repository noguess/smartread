import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReadingPage from './ReadingPage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { articleService } from '../services/articleService'
import { wordService } from '../services/wordService'
import { quizRecordService } from '../services/quizRecordService'
import { settingsService } from '../services/settingsService'
import { llmService } from '../services/llmService'

// Component Mocks
vi.mock('../components/reading/ArticleContent', () => ({ default: () => <div data-testid="article-content">Article Content</div> }))
vi.mock('../components/reading/ReadingProgressBar', () => ({ default: () => <div data-testid="progress-bar" /> }))
vi.mock('../components/reading/ReadingTimer', () => ({ default: () => <div data-testid="reading-timer" /> }))
vi.mock('../components/reading/GenerationLoading', () => ({ default: () => <div data-testid="generation-loading">Loading...</div> }))

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

// Existing llmService mock structure in readingPage.test.tsx was a bit strict.
// We need to re-mock clearly for each test or override here.
// The file previously had: 
// vi.mock('../services/llmService', () => ({ llmService: { generateQuizForArticle: vi.fn() } }))
// We'll keep using vi.mocked() to override behavior per test.

vi.mock('../services/llmService', () => ({
    llmService: {
        generateQuizForArticle: vi.fn(),
        generateArticleOnly: vi.fn()
    }
}))

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
        vi.mocked(settingsService.getSettings).mockResolvedValue({ difficultyLevel: 'L2', apiKey: 'sk-test' } as any)
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

    // ... (Keep existing tests)

    it('shows snackbar and stays on reading view when quiz generation fails', async () => {
        const mockArticle = {
            id: 7,
            uuid: 'uuid-fail',
            title: 'Fail Test',
            content: 'Content',
            targetWords: []
        }
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle as any)

        // Ensure API Key exists to trigger real service
        vi.mocked(settingsService.getSettings).mockResolvedValue({ difficultyLevel: 'L2', apiKey: 'sk-test' } as any)



        // Mock failure with delay to catch loading state
        const errorMsg = 'API Quota Exceeded'
        vi.mocked(llmService.generateQuizForArticle).mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 100))
            throw new Error(errorMsg)
        })

        renderWithRouter('/read/7')

        await waitFor(() => expect(screen.getByTestId('article-content')).toBeInTheDocument())

        // Start Quiz
        const startBtn = screen.getByText('reading:buttons.startQuiz')
        startBtn.click()

        // Should see loading
        await waitFor(() => expect(screen.getByTestId('generation-loading')).toBeInTheDocument())

        // Wait for failure
        await waitFor(() => {
            // Should NOT be in Quiz View
            expect(screen.queryByTestId('quiz-view')).not.toBeInTheDocument()

            // Should be back to Reading View
            expect(screen.getByTestId('article-content')).toBeInTheDocument()

            // Should show Snackbar with error
            // MUI Snackbar usually renders via Portal, but checking by text works
            expect(screen.getByText(errorMsg)).toBeInTheDocument()
        })
    })

    it('shows error UI when article generation fails', async () => {
        // Setup state for generation
        const mockWords = [{ id: 1, spelling: 'test' }]
        const historyState = {
            mode: 'generate',
            words: mockWords,
            settings: { difficultyLevel: 'L2', apiKey: 'sk-test' }
        }

        // Mock dependencies to ensure flow proceeds to LLM call
        vi.mocked(settingsService.getSettings).mockResolvedValue({ difficultyLevel: 'L2', apiKey: 'sk-test' } as any)

        // Mock generation failure
        const errorMsg = 'LLM Error'
        vi.mocked(llmService.generateArticleOnly).mockRejectedValue(new Error(errorMsg))

        console.log('Setup mocks complete')

        render(
            <MemoryRouter initialEntries={[{ pathname: '/reading', state: historyState }]}>
                <Routes>
                    <Route path="/reading" element={<ReadingPage />} />
                </Routes>
            </MemoryRouter>
        )

        // Wait for LLM call
        await waitFor(() => {
            expect(llmService.generateArticleOnly).toHaveBeenCalled()
        })



        // Wait for error
        await waitFor(() => {
            // Look for error text
            expect(screen.getByText('reading:error.generationFailed')).toBeInTheDocument()
            expect(screen.getByText(errorMsg)).toBeInTheDocument()
            expect(screen.getByText('common:button.retry')).toBeInTheDocument()
        })
    })
})
