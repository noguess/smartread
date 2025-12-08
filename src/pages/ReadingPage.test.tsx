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
vi.mock('../services/llmService', () => ({ llmService: {} }))
vi.mock('../services/mockLLMService', () => ({ mockLLMService: {} }))

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

    // Add more tests as needed
})
