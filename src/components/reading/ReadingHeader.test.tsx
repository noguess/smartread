import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ReadingHeader from './ReadingHeader'
import { MemoryRouter } from 'react-router-dom'

// Mock icons
vi.mock('@mui/icons-material', () => ({
    ChevronLeft: () => <span data-testid="icon-back">Back</span>,
    Remove: () => <span data-testid="icon-minus">Minus</span>,
    Add: () => <span data-testid="icon-plus">Plus</span>,
    FormatSize: () => <span data-testid="icon-type">Type</span>,
    AccessTime: () => <span data-testid="icon-clock">Clock</span>,
    PlayArrow: () => <span data-testid="icon-play">Play</span>,
    Pause: () => <span data-testid="icon-pause">Pause</span>,
    RestartAlt: () => <span data-testid="icon-reset">Reset</span>,
}))

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

describe('ReadingHeader', () => {
    const defaultProps = {
        title: 'The Power of a Good Habit',
        fontSize: 18,
        onFontSizeChange: vi.fn(),
        isTimerRunning: true,
        seconds: 125, // 02:05
        onTimerToggle: vi.fn(),
        onTimerReset: vi.fn(),
    }

    it('renders title correctly', () => {
        render(
            <MemoryRouter>
                <ReadingHeader {...defaultProps} />
            </MemoryRouter>
        )
        expect(screen.getByText('The Power of a Good Habit')).toBeInTheDocument()
    })

    it('navigates back when back button is clicked', () => {
        render(
            <MemoryRouter>
                <ReadingHeader {...defaultProps} />
            </MemoryRouter>
        )
        const backBtn = screen.getByTestId('icon-back').closest('button')
        fireEvent.click(backBtn!)
        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('displays formatted time correctly', () => {
        render(
            <MemoryRouter>
                <ReadingHeader {...defaultProps} />
            </MemoryRouter>
        )
        // 125 seconds = 02:05
        expect(screen.getByText('02:05')).toBeInTheDocument()
    })

    it('calls onFontSizeChange when + or - is clicked', () => {
        render(
            <MemoryRouter>
                <ReadingHeader {...defaultProps} />
            </MemoryRouter>
        )

        const minusBtn = screen.getByTestId('icon-minus').closest('button')
        const plusBtn = screen.getByTestId('icon-plus').closest('button')

        fireEvent.click(minusBtn!)
        expect(defaultProps.onFontSizeChange).toHaveBeenCalledWith(16) // 18 - 2

        fireEvent.click(plusBtn!)
        expect(defaultProps.onFontSizeChange).toHaveBeenCalledWith(20) // 18 + 2
    })

    it('toggles timer when pause button is clicked', () => {
        render(
            <MemoryRouter>
                <ReadingHeader {...defaultProps} />
            </MemoryRouter>
        )
        const toggleBtn = screen.getByTestId('icon-pause').closest('button')
        fireEvent.click(toggleBtn!)
        expect(defaultProps.onTimerToggle).toHaveBeenCalled()
    })

    it('shows play icon when timer is paused', () => {
        render(
            <MemoryRouter>
                <ReadingHeader {...defaultProps} isTimerRunning={false} />
            </MemoryRouter>
        )
        expect(screen.getByTestId('icon-play')).toBeInTheDocument()
    })
})
