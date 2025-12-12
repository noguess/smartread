
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

// Mock services
vi.mock('../services/wordService', () => ({
    wordService: {
        getAllWords: vi.fn().mockResolvedValue([])
    }
}))
vi.mock('../services/historyService', () => ({
    historyService: {
        getHistory: vi.fn().mockResolvedValue([])
    }
}))
vi.mock('../services/settingsService', () => ({
    settingsService: {
        getSettings: vi.fn().mockResolvedValue({})
    }
}))
vi.mock('../services/articleService', () => ({
    articleService: {
        getAll: vi.fn().mockResolvedValue([])
    }
}))
vi.mock('../services/quizRecordService', () => ({
    quizRecordService: {
        getAll: vi.fn().mockResolvedValue([])
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

describe('HomePage Responsiveness', () => {
    beforeEach(() => {
        vi.clearAllMocks()
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

    it('renders Desktop layout (Hero + Stats) when screen is large', () => {
        // Mock isMobile = false
        mockUseMediaQuery.mockReturnValue(false)

        renderPage()

        expect(screen.getByTestId('dashboard-hero')).toBeInTheDocument()
        expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument()
        expect(screen.queryByTestId('dashboard-vertical')).not.toBeInTheDocument()
    })

    it('renders Vertical Layout when screen is small (Tablet/Mobile)', () => {
        // Mock isMobile = true (matches theme.breakpoints.down('lg'))
        mockUseMediaQuery.mockReturnValue(true)

        renderPage()

        expect(screen.getByTestId('dashboard-vertical')).toBeInTheDocument()

        // Ensure Desktop components are NOT rendered
        expect(screen.queryByTestId('dashboard-hero')).not.toBeInTheDocument()
        expect(screen.queryByTestId('dashboard-stats')).not.toBeInTheDocument()
    })
})
