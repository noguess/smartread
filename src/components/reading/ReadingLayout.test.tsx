
/**
 * @vitest-environment happy-dom
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ReadingLayout from './ReadingLayout'
import { MemoryRouter } from 'react-router-dom'

// Mock dependencies
vi.mock('./ReadingHeader', () => ({ default: () => <div data-testid="reading-header">Header</div> }))
vi.mock('./ReadingSidebars', () => ({ ReadingSidebar: () => <div data-testid="reading-sidebar">Sidebar</div> }))
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

describe('ReadingLayout', () => {
    const defaultProps = {
        title: 'Test Article',
        fontSize: 18,
        onFontSizeChange: vi.fn(),
        targetWords: [],
        activeWord: null,
        onHoverWord: vi.fn(),
        quizHistory: [],
        onStartQuiz: vi.fn(),
        onReviewQuiz: vi.fn(),
        onTimerToggle: vi.fn(),
        isTimerRunning: false,
        seconds: 0,
        onTimerReset: vi.fn(),
        children: <div data-testid="child-content">Child Content</div>
    }

    it('renders the layout structure', () => {
        render(
            <MemoryRouter>
                <ReadingLayout {...defaultProps} />
            </MemoryRouter>
        )

        expect(screen.getByTestId('reading-header')).toBeInTheDocument()
        expect(screen.getByTestId('reading-sidebar')).toBeInTheDocument()
        expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })

    it('shows header when sidebar is hidden but headerVisible is true (default)', () => {
        render(
            <MemoryRouter>
                <ReadingLayout {...defaultProps} sidebarVisible={false} />
            </MemoryRouter>
        )

        expect(screen.getByTestId('reading-header')).toBeInTheDocument()
    })

    it('hides header when headerVisible is explicit false', () => {
        render(
            <MemoryRouter>
                <ReadingLayout {...defaultProps} headerVisible={false} />
            </MemoryRouter>
        )

        expect(screen.queryByTestId('reading-header')).not.toBeInTheDocument()
    })
})
