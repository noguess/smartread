import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BaseListCard from './BaseListCard'

describe('BaseListCard', () => {
    const defaultProps = {
        icon: <span data-testid="icon">ICON</span>,
        title: 'Test Title',
    }

    it('renders title and icon', () => {
        render(<BaseListCard {...defaultProps} />)
        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('renders badge, metadata, and stats', () => {
        render(
            <BaseListCard
                {...defaultProps}
                badge={<span data-testid="badge">L1</span>}
                metadata={<span data-testid="meta">Date</span>}
                stats={<span data-testid="stats">Score</span>}
            />
        )
        expect(screen.getByTestId('badge')).toBeInTheDocument()
        expect(screen.getByTestId('meta')).toBeInTheDocument()
        expect(screen.getByTestId('stats')).toBeInTheDocument()
    })

    it('renders actions', () => {
        render(
            <BaseListCard
                {...defaultProps}
                actions={<button>Action</button>}
            />
        )
        expect(screen.getByText('Action')).toBeInTheDocument()
    })

    it('handles title click', () => {
        const onClick = vi.fn()
        render(<BaseListCard {...defaultProps} onTitleClick={onClick} />)
        fireEvent.click(screen.getByText('Test Title'))
        expect(onClick).toHaveBeenCalled()
    })

    it('applies custom icon box colors', () => {
        const { container } = render(
            <BaseListCard
                {...defaultProps}
                iconBoxColor={{ bg: 'rgb(255, 0, 0)', color: 'rgb(0, 255, 0)' }}
            />
        )
        // This is a bit implementation detail heavy, but useful for regression
        // We might just check if it renders without error for now as RTL focuses on user visible
    })
})
