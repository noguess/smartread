
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '../pages/HomePage'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'

// Mock sub-components to focus on grid layout structure
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

    it('uses correct grid breakpoints for Tablet adaptation', async () => {
        renderPage()

        // Find the Grid items wrapping Hero and Stats
        // We look for the parent Grid item of our mocked components
        const hero = screen.getByTestId('dashboard-hero')
        const stats = screen.getByTestId('dashboard-stats')

        // In MUI v5, the Grid component passes classes like 'MuiGrid-grid-xs-12' 'MuiGrid-grid-lg-8'
        // We need to traverse up to the Grid Item div
        const heroGridItem = hero.closest('.MuiGrid-item')
        const statsGridItem = stats.closest('.MuiGrid-item')

        expect(heroGridItem).not.toBeNull()
        expect(statsGridItem).not.toBeNull()

        // Check for Tablet Adaptation strategy:
        // Before Fix: md={8} / md={4} (Split on Tablet)
        // After Fix Goal: lg={8} / lg={4} (Stack on Tablet which is < lg)
        // Note: class names might vary slightly in test env but usually follow pattern

        // We verify that they HAVE 'MuiGrid-grid-lg-8' and 'MuiGrid-grid-lg-4'
        // And they should typically default to xs-12 stack behaviors if screen is smaller than lg.
        // The key is ensuring 'lg' breakpoint is used for the split, not 'md'.

        // Note: Since we haven't implemented the fix yet, these expectations might fail if we assert strict new classes.
        // We want to write the test to expect the NEW behavior.

        // Check Hero classes
        expect(heroGridItem).toHaveClass('MuiGrid-grid-xs-12')
        // We want to force it to be stacked on md, so it should NOT have MuiGrid-grid-md-8 anymore
        // It SHOULD have MuiGrid-grid-lg-8
        expect(heroGridItem).toHaveClass('MuiGrid-grid-lg-8')
        expect(heroGridItem).not.toHaveClass('MuiGrid-grid-md-8')

        // Check Stats classes
        expect(statsGridItem).toHaveClass('MuiGrid-grid-xs-12')
        expect(statsGridItem).toHaveClass('MuiGrid-grid-lg-4')
        expect(statsGridItem).not.toHaveClass('MuiGrid-grid-md-4')
    })
})
