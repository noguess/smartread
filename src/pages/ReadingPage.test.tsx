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
})
