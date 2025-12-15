
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import HomePage from '../pages/HomePage'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import * as MuiMaterial from '@mui/material'

// Mock sub-components
vi.mock('../components/dashboard/DashboardHero', () => ({
    default: () => <div data-testid="dashboard-hero">Hero</div>
}))
vi.mock('../components/dashboard/DashboardStats', () => ({
    default: () => <div data-testid="dashboard-stats">Stats</div>
}))
vi.mock('../components/dashboard/RecentActivityList', () => ({
    default: () => <div data-testid="recent-activity">Activity</div>
}))
vi.mock('../components/dashboard/ManualGenerationDialog', () => ({
    default: () => <div data-testid="manual-dialog">Dialog</div>
}))
vi.mock('../components/dashboard/DashboardVerticalLayout', () => ({
    default: () => <div data-testid="dashboard-vertical">Vertical Layout</div>
}))
vi.mock('../components/common/PageLoading', () => ({
    default: () => <div data-testid="page-loading">Loading...</div>
}))
vi.mock('../components/common/PageError', () => ({
    default: ({ error }: { error: Error }) => <div data-testid="page-error">{error.message}</div>
}))

// Mock services
const mockGetAllWords = vi.fn()
const mockGetHistory = vi.fn()
const mockGetSettings = vi.fn()
const mockGetArticles = vi.fn()
const mockGetQuizzes = vi.fn()

vi.mock('../services/wordService', () => ({
    wordService: {
        getAllWords: () => mockGetAllWords()
    }
}))
vi.mock('../services/historyService', () => ({
    historyService: {
        getHistory: () => mockGetHistory()
    }
}))
vi.mock('../services/settingsService', () => ({
    settingsService: {
        getSettings: () => mockGetSettings()
    }
}))
vi.mock('../services/articleService', () => ({
    articleService: {
        getAll: () => mockGetArticles()
    }
}))
vi.mock('../services/quizRecordService', () => ({
    quizRecordService: {
        getAll: () => mockGetQuizzes()
    }
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

// Mock useMediaQuery
const mockUseMediaQuery = vi.fn()
vi.mock('@mui/material', async (importOriginal) => {
    const actual = await importOriginal<typeof MuiMaterial>()
    return {
        ...actual,
        useMediaQuery: (query: any) => mockUseMediaQuery(query),
    }
})

const theme = createTheme()

describe('HomePage Responsiveness & States', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default successful mocks
        mockGetAllWords.mockResolvedValue([])
        mockGetHistory.mockResolvedValue([])
        mockGetSettings.mockResolvedValue({})
        mockGetArticles.mockResolvedValue([])
        mockGetQuizzes.mockResolvedValue([])
        mockUseMediaQuery.mockReturnValue(false) // Desktop default
    })

    const renderPage = () => {
        return render(
            <ThemeProvider theme={theme}>
                <BrowserRouter>
                    <HomePage />
                </BrowserRouter>
            </ThemeProvider>
        )
    }

    it('renders Desktop layout (Hero + Stats) when screen is large', async () => {
        // Mock isMobile = false
        mockUseMediaQuery.mockReturnValue(false)

        await act(async () => {
            renderPage()
        })

        await waitFor(() => {
            expect(screen.getByTestId('dashboard-hero')).toBeInTheDocument()
            expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument()
            expect(screen.queryByTestId('dashboard-vertical')).not.toBeInTheDocument()
        })
    })

    it('renders Vertical Layout when screen is small (Tablet/Mobile)', async () => {
        // Mock isMobile = true
        mockUseMediaQuery.mockReturnValue(true)

        await act(async () => {
            renderPage()
        })

        await waitFor(() => {
            expect(screen.getByTestId('dashboard-vertical')).toBeInTheDocument()
            expect(screen.queryByTestId('dashboard-hero')).not.toBeInTheDocument()
            expect(screen.queryByTestId('dashboard-stats')).not.toBeInTheDocument()
        })
    })

    it('shows loading state initially', async () => {
        // Mock promise that never resolves immediately to test loading state
        mockGetAllWords.mockReturnValue(new Promise(() => { }))

        renderPage()

        expect(screen.getByTestId('page-loading')).toBeInTheDocument()
    })

    it('shows error state when data loading fails', async () => {
        const errorMsg = 'Failed to fetch data'
        mockGetAllWords.mockRejectedValue(new Error(errorMsg))

        await act(async () => {
            renderPage()
        })

        await waitFor(() => {
            expect(screen.getByTestId('page-error')).toBeInTheDocument()
            expect(screen.getByText(errorMsg)).toBeInTheDocument()
        })
    })
})
