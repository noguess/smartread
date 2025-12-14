import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReadingPage from './ReadingPage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { articleService } from '../services/articleService'
import { wordService } from '../services/wordService'
import { quizRecordService } from '../services/quizRecordService'
import { settingsService } from '../services/settingsService'
import { llmService } from '../services/llmService'
import { mockLLMService } from '../services/mockLLMService'


// Service Mocks
vi.mock('../services/articleService')
vi.mock('../services/wordService')
vi.mock('../services/quizRecordService')
vi.mock('../services/settingsService')
vi.mock('../services/llmService')
vi.mock('../services/mockLLMService')

vi.mock('../components/reading/GenerationLoading', () => ({ default: () => <div data-testid="generation-loading">Loading...</div> }))

// Component Mocks
vi.mock('../hooks/useStudyTimer', () => ({
    useStudyTimer: () => ({
        timeSpent: 0,
        isActive: false,
        start: vi.fn(),
        pause: vi.fn(),
        reset: vi.fn()
    })
}))

// Component Mocks
// We Mock the "Leaf" pages to verify routing, but keep Layout to test interaction
vi.mock('./ArticleView', () => ({ default: () => <div data-testid="article-view">Article View Component</div> }))
vi.mock('./QuizPage', () => ({
    default: ({ onQuizSubmit }: any) => (
        <div data-testid="quiz-page">
            <button onClick={() => onQuizSubmit({ reading: {}, vocabulary: {} })}>Submit Quiz</button>
        </div>
    )
}))
vi.mock('./ResultPage', () => ({ default: () => <div data-testid="result-page">Result Page Component</div> }))

// Mock dependent components in Layout if needed, but we want Sidebar to work
vi.mock('../components/reading/ReadingHeader', () => ({ default: () => <div data-testid="reading-header">Header</div> }))

// I18n Mock
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
    initReactI18next: { type: '3rdParty', init: vi.fn() }
}))

describe('ReadingPage Integration', () => {
    const mockArticle = {
        id: 1,
        uuid: 'uuid-1',
        title: 'Test Article',
        content: 'Content',
        targetWords: ['test'],
        wordCtxMeanings: []
    }

    const mockWord = { id: 1, spelling: 'test', status: 'New' }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle as any)
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue(mockWord as any)
        vi.mocked(settingsService.getSettings).mockResolvedValue({ difficultyLevel: 'L2', apiKey: 'sk-test' } as any)
        // Default: No history
        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([])
    })

    const renderPage = (initialEntry = '/read/1') => {
        return render(
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/read/:articleId/*" element={<ReadingPage />} />
                </Routes>
            </MemoryRouter>
        )
    }

    it('renders ArticleView by default', async () => {
        renderPage('/read/1')
        await waitFor(() => expect(screen.getByTestId('article-view')).toBeInTheDocument())
        expect(articleService.getById).toHaveBeenCalledWith(1)
    })

    it('starts a quiz (generates draft) when clicking Start Quiz', async () => {
        // Setup LLM Mock
        const mockQuizData = {
            readingQuestions: [{ id: 'q1', stem: 'Q1', answer: 'A' }],
            vocabularyQuestions: []
        }
        vi.mocked(llmService.generateQuizForArticle).mockResolvedValue(mockQuizData as any)
        vi.mocked(mockLLMService.generateQuizForArticle).mockResolvedValue(mockQuizData as any)


        // Setup Save Mock
        vi.mocked(quizRecordService.saveQuizRecord).mockResolvedValue(100)
        vi.mocked(quizRecordService.getQuizRecordById).mockResolvedValue({
            id: 100,
            questions: mockQuizData,
            score: undefined
        } as any)

        // Setup GetHistory to return the new draft after save (simulating refresh)
        // Using mockImplementationOnce logic for sequential calls could work, 
        // but ReadingPage calls getRecordsByArticleUuid independently

        renderPage('/read/1')
        await waitFor(() => expect(screen.getByTestId('article-view')).toBeInTheDocument())

        // Find and click Challenge Now
        const btn = screen.getByText('reading:sidebar.challengeNow')
        fireEvent.click(btn)

        // Wait for Generation (mocked fast)
        await waitFor(() => {
            // Should call LLM
            expect(llmService.generateQuizForArticle).toHaveBeenCalled()
            // Should Save Draft
            expect(quizRecordService.saveQuizRecord).toHaveBeenCalledWith(expect.objectContaining({
                articleId: 'uuid-1'
            }))
        })

        // Should Navigate to QuizPage
        // Since we use MemoryRouter, the URL update is internal, 
        // but the component rendering QuizPage confirms logic
        await waitFor(() => expect(screen.getByTestId('quiz-page')).toBeInTheDocument())
    })

    it('generates new quiz (and PRESERVES old draft) if present', async () => {
        // Mock a draft record
        const draftRecord = {
            id: 200,
            articleId: 'uuid-1',
            date: Date.now(),
            questions: {
                reading: [{ id: 'draft-q1' }],
                vocabulary: []
            },
            score: undefined // Draft
        }

        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([draftRecord as any])
        // We do NOT call delete anymore

        // Mock Generation
        const newQuizData = {
            readingQuestions: [{ id: 'new-q1' }],
            vocabularyQuestions: []
        }
        vi.mocked(llmService.generateQuizForArticle).mockResolvedValue(newQuizData as any)
        vi.mocked(mockLLMService.generateQuizForArticle).mockResolvedValue(newQuizData as any)
        vi.mocked(quizRecordService.saveQuizRecord).mockResolvedValue(300)

        renderPage('/read/1')
        await waitFor(() => expect(screen.getByTestId('article-view')).toBeInTheDocument())

        // Click Start Quiz
        const btn = screen.getByText('reading:sidebar.challengeNow')
        fireEvent.click(btn)

        // Should NOT delete old draft
        expect(quizRecordService.delete).not.toHaveBeenCalled()

        // Should generate NEW quiz
        await waitFor(() => {
            expect(llmService.generateQuizForArticle).toHaveBeenCalled()
        })

        // Should save NEW draft
        await waitFor(() => {
            expect(quizRecordService.saveQuizRecord).toHaveBeenCalledWith(expect.objectContaining({ score: undefined }))
        })

        // Should navigate to NEW QuizPage
        await waitFor(() => expect(screen.getByTestId('quiz-page')).toBeInTheDocument())
    })

    it('navigates directly to quiz via ID route', async () => {
        const draftRecord = {
            id: 200,
            articleId: 'uuid-1',
            date: Date.now(),
            questions: { reading: [{ id: 'q1' }], vocabulary: [] },
            score: undefined
        }
        // Wrapper will try to find in history first, or fetch by ID
        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([draftRecord as any])
        vi.mocked(quizRecordService.getQuizRecordById).mockResolvedValue(draftRecord as any)

        renderPage('/read/1/quiz/200')

        // Should load draft and show QuizPage
        await waitFor(() => expect(screen.getByTestId('quiz-page')).toBeInTheDocument())
    })

    it('navigates to result page on submit (Regression Check)', async () => {
        const draftRecord = {
            id: 200,
            articleId: 'uuid-1',
            date: Date.now(),
            questions: {
                reading: [{ id: 'q1', answer: 'A' }],
                vocabulary: []
            },
            score: undefined
        }

        // Initial Load
        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([draftRecord as any])
        vi.mocked(quizRecordService.getQuizRecordById).mockResolvedValue(draftRecord as any)

        // Update Mock: when submitted, it becomes a result (has score)
        vi.mocked(quizRecordService.updateQuizRecord).mockResolvedValue(1)

        renderPage('/read/1/quiz/200')

        // Wait for Quiz Page
        await waitFor(() => expect(screen.getByTestId('quiz-page')).toBeInTheDocument())

        // Click Submit
        const btn = screen.getByText('Submit Quiz')
        fireEvent.click(btn)

        // Should Update Record
        await waitFor(() => {
            expect(quizRecordService.updateQuizRecord).toHaveBeenCalledWith(200, expect.any(Object))
        })

        // Should Navigate to Result Page /read/1/result/200
        await waitFor(() => expect(screen.getByTestId('result-page')).toBeInTheDocument())
    })
    it('generates article when navigated from Home with state', async () => {
        const generationUuid = 'gen-uuid-123'
        const generationWords = [{ spelling: 'hello', status: 'New' }]
        const generationSettings = { difficultyLevel: 'L2', apiKey: 'test-key' }

        // Mock generate response
        vi.mocked(llmService.generateArticleOnly).mockResolvedValue({
            title: 'Gen Title',
            content: 'Gen Content',
            targetWords: ['hello'],
            word_study: []
        } as any)
        vi.mocked(mockLLMService.generateArticleOnly).mockResolvedValue({
            title: 'Gen Title',
            content: 'Gen Content',
            targetWords: ['hello'],
            word_study: []
        } as any)

        vi.mocked(articleService.add).mockResolvedValue(999)

        // Render with state
        render(
            <MemoryRouter initialEntries={[{
                pathname: '/reading',
                state: {
                    mode: 'generate',
                    words: generationWords,
                    settings: generationSettings,
                    uuid: generationUuid
                }
            }]}>
                <Routes>
                    // Note: The real App uses /reading for generation and /read/:id for viewing
                    // But ReadingPage handles both based on params/state
                    <Route path="/reading" element={<ReadingPage />} />
                    <Route path="/read/:articleId" element={<div data-testid="article-view-redirected">Redirected</div>} />
                </Routes>
            </MemoryRouter>
        )

        // Should show loading
        await waitFor(() => expect(screen.getByTestId('generation-loading')).toBeInTheDocument())

        // Should call generate
        await waitFor(() => {
            expect(llmService.generateArticleOnly).toHaveBeenCalled() // or mockLLMService depending on setup
        })

        // Should save article with PROVIDED UUID
        await waitFor(() => {
            expect(articleService.add).toHaveBeenCalledWith(expect.objectContaining({
                uuid: generationUuid,
                title: 'Gen Title'
            }))
        })

        // Should navigate to /read/999
        await waitFor(() => expect(screen.getByTestId('article-view-redirected')).toBeInTheDocument())
    })
    it('shows error message when generation fails', async () => {
        const generationUuid = 'fail-uuid-123'
        const generationWords = [{ spelling: 'fail', status: 'New' }]

        // Mock generate failure
        vi.mocked(llmService.generateArticleOnly).mockRejectedValue(new Error('API Error'))
        vi.mocked(mockLLMService.generateArticleOnly).mockRejectedValue(new Error('API Error'))

        render(
            <MemoryRouter initialEntries={[{
                pathname: '/reading',
                state: {
                    mode: 'generate',
                    words: generationWords,
                    settings: { difficultyLevel: 'L2', apiKey: 'test-key' },
                    uuid: generationUuid
                }
            }]}>
                <Routes>
                    <Route path="/reading" element={<ReadingPage />} />
                    <Route path="/read/:articleId" element={<div data-testid="article-view-redirected">Redirected</div>} />
                </Routes>
            </MemoryRouter>
        )

        // Should show loading first
        await waitFor(() => expect(screen.getByTestId('generation-loading')).toBeInTheDocument())

        // Then should show error message (even simple text for now)
        await waitFor(() => {
            expect(screen.getByText('reading:error.title')).toBeInTheDocument()
        })

        // Should NOT navigate to article view
        expect(screen.queryByTestId('article-view-redirected')).not.toBeInTheDocument()
    })

    it('allows retry when generation fails', async () => {
        const generationUuid = 'retry-uuid-123'
        const generationWords = [{ spelling: 'retry', status: 'New' }]
        const generationSettings = { difficultyLevel: 'L2', apiKey: 'test-key' }

        // 1. First attempt fails
        vi.mocked(llmService.generateArticleOnly).mockRejectedValueOnce(new Error('First Fail'))
        vi.mocked(mockLLMService.generateArticleOnly).mockRejectedValueOnce(new Error('First Fail'))

        // 2. Second attempt succeeds
        vi.mocked(llmService.generateArticleOnly).mockResolvedValue({
            title: 'Retry Success',
            content: 'Content',
            targetWords: ['retry'],
            word_study: []
        } as any)
        vi.mocked(mockLLMService.generateArticleOnly).mockResolvedValue({
            title: 'Retry Success',
            content: 'Content',
            targetWords: ['retry'],
            word_study: []
        } as any)
        vi.mocked(articleService.add).mockResolvedValue(888)

        render(
            <MemoryRouter initialEntries={[{
                pathname: '/reading',
                state: {
                    mode: 'generate',
                    words: generationWords,
                    settings: generationSettings,
                    uuid: generationUuid
                }
            }]}>
                <Routes>
                    <Route path="/reading" element={<ReadingPage />} />
                    <Route path="/read/:articleId" element={<div data-testid="article-view-redirected">Redirected</div>} />
                </Routes>
            </MemoryRouter>
        )

        // Expect Failure UI
        await waitFor(() => expect(screen.getByText('First Fail')).toBeInTheDocument())

        // Find Retry Button (Mocked i18n returns key)
        const retryBtn = screen.getByText('reading:error.retry')
        fireEvent.click(retryBtn)

        // Should return to Loading
        await waitFor(() => expect(screen.getByTestId('generation-loading')).toBeInTheDocument())

        // Should eventually succeed and navigate
        await waitFor(() => expect(screen.getByTestId('article-view-redirected')).toBeInTheDocument())
    })
})
