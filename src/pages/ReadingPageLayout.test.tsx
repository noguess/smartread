
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReadingPage from './ReadingPage'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { articleService } from '../services/articleService'

// Service Mocks
vi.mock('../services/articleService', () => ({
    articleService: {
        getById: vi.fn(),
        add: vi.fn(),
        getByUuid: vi.fn()
    }
}))
vi.mock('../services/wordService', () => ({
    wordService: {
        getWordBySpelling: vi.fn().mockResolvedValue({ id: 1, spelling: 'word' })
    }
}))
vi.mock('../services/quizRecordService', () => ({
    quizRecordService: {
        getRecordsByArticleUuid: vi.fn().mockResolvedValue([])
    }
}))
vi.mock('../services/settingsService', () => ({
    settingsService: {
        getSettings: vi.fn().mockResolvedValue({})
    }
}))

// Component Mocks
vi.mock('../components/reading/ArticleContent', () => ({
    default: () => <div data-testid="article-content">Article Content</div>
}))
vi.mock('../components/reading/ReadingToolbar', () => ({
    default: () => <div data-testid="reading-toolbar">Toolbar</div>
}))

// I18n Mock
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
    initReactI18next: { type: '3rdParty', init: () => { } }
}))

const theme = createTheme()

describe('ReadingPage Layout', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(articleService.getById).mockResolvedValue({
            id: 1,
            uuid: 'test-uuid',
            title: 'Test Article',
            content: 'Content',
            targetWords: ['word'],
            difficultyLevel: 'L2',
            wordCtxMeanings: []
        } as any)
    })

    const renderPage = () => {
        return render(
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={['/read/1']}>
                    <Routes>
                        <Route path="/read/:id" element={<ReadingPage />} />
                    </Routes>
                </MemoryRouter>
            </ThemeProvider>
        )
    }

    it('adapts layout for Mobile/Tablet vs Desktop', async () => {
        renderPage()

        await screen.findByTestId('article-content')

        // 1. Sidebar Verification
        const difficultyLabel = screen.queryByText('reading:sidebar.difficulty')
        const sidebarGridItem = difficultyLabel?.closest('.MuiGrid-item')
        // Sidebar hidden on Mobile/Tablet (xs: none), Visible on Desktop (lg: block)
        // Note: We check the classes provided by MUI properties
        expect(sidebarGridItem).toHaveClass('MuiGrid-grid-xs-12')
        expect(sidebarGridItem).toHaveClass('MuiGrid-grid-lg-2')
        // Using getComputedStyle in jsdom is unreliable for 'display', strictly checking classes is safer for responsiveness tests

        // 2. Article Content Verification
        const articleContent = screen.getByTestId('article-content')
        const articleGridItem = articleContent.closest('.MuiGrid-item')
        // Full width on Mobile/Tablet (xs: 12), Partial on Desktop (lg: 9)
        expect(articleGridItem).toHaveClass('MuiGrid-grid-xs-12')
        expect(articleGridItem).toHaveClass('MuiGrid-grid-lg-9')

        // 3. Toolbar Verification
        const toolbars = screen.getAllByTestId('reading-toolbar')
        expect(toolbars).toHaveLength(2) // One for Desktop, One for Mobile

        // Desktop Toolbar (Right side)
        // Hidden on Mobile (xs: none), Visible on Desktop (lg: block)
        const desktopToolbarWrapper = toolbars[0].closest('.MuiGrid-item')
        expect(desktopToolbarWrapper).toHaveClass('MuiGrid-grid-lg-1')

        // Mobile Toolbar (Bottom)
        // Visible on Mobile (xs: block), Hidden on Desktop (lg: none)
        const mobileToolbarWrapper = toolbars[1].closest('.MuiGrid-item')
        // It has xs={12}
        expect(mobileToolbarWrapper).toHaveClass('MuiGrid-grid-xs-12')

        // Check display props logic via checking if they differ
        // Desktop one should have lg-1, Mobile one should NOT have lg-1 (it defaults to hidden on lg via sx, or just different structure)
        // Actually, the Mobile one has `display: { xs: 'block', lg: 'none' }`
        // The Desktop one has `display: { xs: 'none', lg: 'block' }`
    })
})
