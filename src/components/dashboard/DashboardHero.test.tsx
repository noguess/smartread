
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardHero from './DashboardHero'
import { ThemeProvider, createTheme } from '@mui/material/styles'

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

const theme = createTheme()

describe('DashboardHero Layout Adaptation', () => {
    const defaultProps = {
        onSmartGenerate: vi.fn(),
        onManualMode: vi.fn(),
        consecutiveDays: 5,
        totalMinutes: 30,
        lastLearningDate: '2023-01-01',
        recommendedWord: {
            id: '1',
            spelling: 'test',
            meaning: 'check',
            phonetic: '/test/',
            status: 'New',
            nextReviewAt: 0,
            interval: 0,
            repetitionCount: 0,
            lastSeenAt: 0
        } as any
    }

    const renderComponent = () => {
        return render(
            <ThemeProvider theme={theme}>
                <DashboardHero {...defaultProps} />
            </ThemeProvider>
        )
    }

    it('uses correct grid breakpoints for internal vertical stacking on Tablet', () => {
        renderComponent()

        // Find the "Content" part (contains Title)
        // We can find it by text 'home:hero.greeting'
        const greeting = screen.getByText(/home:hero.greeting/)
        const contentGridItem = greeting.closest('.MuiGrid-item')

        // Find the "Word Card" part
        // We can find it by text 'home:hero.dailyWord'
        const wordCardTitle = screen.getByText(/home:hero.dailyWord/)
        const wordCardGridItem = wordCardTitle.closest('.MuiGrid-item')

        expect(contentGridItem).not.toBeNull()
        expect(wordCardGridItem).not.toBeNull()

        // Verify Breakpoints
        // Goal: Stack on md (Tablet). Split on lg (Desktop).
        // Current Code (to be fixed): md={8} / md={4}
        // Expected New Code: lg={8} / lg={4}

        // Check Content Column
        expect(contentGridItem).toHaveClass('MuiGrid-grid-xs-12')
        expect(contentGridItem).toHaveClass('MuiGrid-grid-lg-8')
        // Should NOT have md-8 anymore because we want it full width (stacked) on md
        expect(contentGridItem).not.toHaveClass('MuiGrid-grid-md-8')

        // Check Word Card Column
        expect(wordCardGridItem).toHaveClass('MuiGrid-grid-xs-12')
        expect(wordCardGridItem).toHaveClass('MuiGrid-grid-lg-4')
        expect(wordCardGridItem).not.toHaveClass('MuiGrid-grid-md-4')
    })
})
