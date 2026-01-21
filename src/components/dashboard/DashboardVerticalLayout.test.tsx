import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DashboardVerticalLayout from './DashboardVerticalLayout'
import { WordStatus } from '../../services/db'

// Mock icons
vi.mock('@mui/icons-material', () => ({
    LocalFireDepartment: () => <span data-testid="icon-flame" />,
    AccessTime: () => <span data-testid="icon-clock" />,
    AutoAwesome: () => <span data-testid="icon-sparkles" />,
    Tune: () => <span data-testid="icon-tune" />,
    VolumeUp: () => <span data-testid="icon-volume" />,
    BarChart: () => <span data-testid="icon-bar-chart" />,
    RotateLeft: () => <span data-testid="icon-rotate" />,
    TrendingUp: () => <span data-testid="icon-trending" />,
    MenuBook: () => <span data-testid="icon-book" />,
    CollectionsBookmark: () => <span data-testid="icon-library" />,
    // Fix: Add icons needed by StatusBadge
    FiberNew: () => <span data-testid="icon-new" />,
    School: () => <span data-testid="icon-school" />,
    Refresh: () => <span data-testid="icon-refresh" />,
    CheckCircle: () => <span data-testid="icon-check" />,
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'home:hero.min': 'min',
                'home:hero.greeting': 'Hello',
                'home:hero.streak': 'Streak',
                'home:hero.keepGoing': 'Keep Going',
                'home:stats.masteryPercent': '20%',
                'home:stats.reviewNeeded': 'Review',
                'home:stats.newWords': 'New',
                'home:stats.learning': 'Learning',
                'home:stats.total': 'Total',
                'home:hero.smartGenerate': 'Smart Generate',
                'home:hero.customMode': 'Custom Mode'
            }
            return map[key] || key
        }
    })
}))

describe('DashboardVerticalLayout', () => {
    const mockHeroProps = {
        onSmartGenerate: vi.fn(),
        onManualMode: vi.fn(),
        consecutiveDays: 5,
        totalMinutes: 45,
        lastLearningDate: '2023-10-01',
        recommendedWord: {
            id: 1,
            spelling: 'test',
            meaning: 'test meaning',
            status: 'New' as WordStatus,
            nextReviewAt: 0,
            interval: 0,
            repetitionCount: 0,
            lastSeenAt: 0,
            phonetic: '/test/'
        },
        onOpenDetail: vi.fn(),
        onStartDrill: vi.fn()
    }

    const mockStatsProps = {
        totalWords: 100,
        masteredCount: 20,
        statusCounts: {
            New: 10,
            Learning: 30,
            Review: 40,
            Mastered: 20
        }
    }

    it('renders hero section correctly', () => {
        render(<DashboardVerticalLayout {...mockHeroProps} {...mockStatsProps} />)

        expect(screen.getByText('5')).toBeInTheDocument()
        // Check for minutes and label separately or loosely because of the <span> structure
        expect(screen.getByText('45')).toBeInTheDocument()
        expect(screen.getByText('min')).toBeInTheDocument()
        expect(screen.getByText('test')).toBeInTheDocument()
        expect(screen.getByText('test meaning')).toBeInTheDocument()
    })

    it('renders stats section correctly', () => {
        render(<DashboardVerticalLayout {...mockHeroProps} {...mockStatsProps} />)

        expect(screen.getByText('100')).toBeInTheDocument() // Total
        expect(screen.getByText('20%')).toBeInTheDocument() // Mastered percent
    })

    it('calls action handlers', () => {
        render(<DashboardVerticalLayout {...mockHeroProps} {...mockStatsProps} />)

        const smartBtn = screen.getByText('Smart Generate')
        fireEvent.click(smartBtn)
        expect(mockHeroProps.onSmartGenerate).toHaveBeenCalled()

        const manualBtn = screen.getByText('Custom Mode')
        fireEvent.click(manualBtn)
        expect(mockHeroProps.onManualMode).toHaveBeenCalled()
    })

    it('calls onOpenDetail when Deep Learning link is clicked', () => {
        render(<DashboardVerticalLayout {...mockHeroProps} {...mockStatsProps} />)
        // Note: The text is mocked as 'home:hero.deepLearning' in the test setup above?
        // Wait, the mock in this file for i18n returns `map[key] || key`.
        // We need to add 'home:hero.deepLearning' to the mock map or expect the key.
        // Let's check the mock map in `DashboardVerticalLayout.test.tsx`.
        // It doesn't have deepLearning yet.
        // For now, let's assume update the map too or just expect the key/default.
        // Since I can't see the map update in this specific tool call, I will just add the test and use the key if not mapped.
        // Actually, I should update the mock map first or simultaneously.
        // But replacing the map is another chunk.
        // I'll trust that I can update the mock map in a separate step or just assume it returns keys if missing.
        // The mock implementation returns `map[key] || key`.
        // So I should search for 'home:hero.deepLearning' if I don't add it to map.
        const deepLink = screen.getByText('home:hero.deepLearning')
        fireEvent.click(deepLink)
        expect(mockHeroProps.onOpenDetail).toHaveBeenCalledWith('test')
    })
})
