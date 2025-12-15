import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReadingPage from './ReadingPage'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { articleService } from '../services/articleService'
import { wordService } from '../services/wordService'
import { quizRecordService } from '../services/quizRecordService'
import { settingsService } from '../services/settingsService'

// Mock Services
vi.mock('../services/articleService')
vi.mock('../services/wordService')
vi.mock('../services/quizRecordService')
vi.mock('../services/settingsService')
vi.mock('../services/llmService')
vi.mock('../services/mockLLMService')

// Mock Child Components
vi.mock('./ArticleView', () => ({
    default: ({ scrollToWord }: { scrollToWord?: string }) => (
        <div data-testid="article-view" data-scrolling-word={scrollToWord}>
            Article View
        </div>
    )
}))
// Use a real-like sidebar mock or let it render? 
// ReadingPage imports ReadingLayout, which imports ReadingSidebar.
// If we want to test interaction between Sidebar and ArticleView via ReadingPage state, we should let them render.
// However, ReadingPage.test.tsx mocks dependencies.
// Let's assume ReadingSidebar is rendered because ReadingLayout is NOT mocked in this specific test file context 
// (or we can assume standard non-mock for components we want to integration test).

// Re-using mocks from ReadingPage.test.tsx style
vi.mock('../hooks/useStudyTimer', () => ({
    useStudyTimer: () => ({
        timeSpent: 10,
        isActive: true,
        start: vi.fn(),
        pause: vi.fn(),
        reset: vi.fn()
    })
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
    initReactI18next: { type: '3rdParty', init: vi.fn() }
}))

describe('ReadingPage Interactions', () => {
    const mockArticle = {
        id: 1,
        uuid: 'uuid-1',
        title: 'Interaction Test',
        content: 'Content',
        targetWords: ['banana'],
        wordCtxMeanings: []
    }

    const mockWord = { id: 1, spelling: 'banana', meaning: 'fruit', status: 'New' }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(articleService.getById).mockResolvedValue(mockArticle as any)
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue(mockWord as any)
        vi.mocked(settingsService.getSettings).mockResolvedValue({} as any)
        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([])
    })

    it('propagates scroll word from sidebar to ArticleView', async () => {
        render(
            <MemoryRouter initialEntries={['/read/1']}>
                <Routes>
                    <Route path="/read/:articleId/*" element={<ReadingPage />} />
                </Routes>
            </MemoryRouter>
        )

        // Wait for load
        await waitFor(() => expect(screen.getByTestId('article-view')).toBeInTheDocument())

        // Sidebar should be rendering "banana"
        const sidebarWord = await screen.findByText('banana')
        expect(sidebarWord).toBeInTheDocument()

        // Click the word in sidebar
        fireEvent.click(sidebarWord)

        // Verify ArticleView received the prop
        await waitFor(() => {
            const articleView = screen.getByTestId('article-view')
            expect(articleView).toHaveAttribute('data-scrolling-word', 'banana')
        })
    })


})
