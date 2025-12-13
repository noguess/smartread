import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReadingPage from './ReadingPage'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { wordService } from '../services/wordService'
import { articleService } from '../services/articleService'
import { quizRecordService } from '../services/quizRecordService'
import { settingsService } from '../services/settingsService'
import { Word, Article } from '../services/db'

// Mock services
vi.mock('../services/wordService')
vi.mock('../services/articleService')
vi.mock('../services/quizRecordService')
vi.mock('../services/settingsService')



vi.mock('../hooks/useStudyTimer', () => ({
    useStudyTimer: () => ({
        isPaused: true,
        seconds: 0,
        start: vi.fn(),
        pause: vi.fn()
    })
}))
vi.mock('../services/llmService', () => ({
    llmService: {
        generateArticleOnly: vi.fn(),
        generateQuizOnly: vi.fn()
    }
}))
vi.mock('@mui/material', async (importOriginal) => {
    const actual = await importOriginal() as any
    return {
        ...actual,
        Fade: ({ children }: any) => <div>{children}</div>
    }
})

// Mock Sub-Components to isolate layout test
vi.mock('../components/reading/ReadingHeader', () => ({
    default: ({ title }: any) => <div data-testid="reading-header">{title}</div>
}))
vi.mock('../components/reading/ReadingSidebars', () => ({
    ReadingSidebar: () => <div data-testid="reading-sidebar">Sidebar</div>
}))
vi.mock('../components/reading/ArticleContent', () => ({
    default: () => <div data-testid="reading-article-content">Article</div>
}))
vi.mock('../components/reading/QuizView', () => ({
    default: () => <div data-testid="quiz-view">Quiz</div>
}))

const mockArticle: Article = {
    id: 1,
    uuid: 'uuid-123',
    title: 'Test Article',
    content: 'This is test content.',
    targetWords: ['word1'],
    difficultyLevel: 'L2',
    createdAt: Date.now(),
    source: 'generated',
    wordCtxMeanings: []
}

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
            changeLanguage: vi.fn(),
        },
    }),
    I18nextProvider: ({ children }: any) => <div>{children}</div>
}))

describe('ReadingPage Layout', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(articleService.getByUuid).mockResolvedValue(mockArticle)
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle)
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue({ id: 1, spelling: 'word1' } as Word)
        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([])
        vi.mocked(settingsService.getSettings).mockResolvedValue({} as any)
    })

    it('renders Header, Article, and Sidebar in 9-3 layout', async () => {
        render(
            <MemoryRouter initialEntries={['/read/1']}>
                <Routes>
                    <Route path="/read/:articleId" element={<ReadingPage />} />
                </Routes>
            </MemoryRouter>
        )

        // Wait for data load
        await waitFor(() => {
            expect(screen.getByTestId('reading-header')).toBeInTheDocument()
        })

        expect(screen.getByTestId('reading-article-content')).toBeInTheDocument()
        expect(screen.getByTestId('reading-sidebar')).toBeInTheDocument()

        // Verify Header Title
        expect(screen.getByText('Test Article')).toBeInTheDocument()
    })
})
