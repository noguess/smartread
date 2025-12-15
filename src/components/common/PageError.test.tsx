import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PageError from './PageError'

describe('PageError', () => {
    it('renders error message', () => {
        const error = new Error('Test Error')
        render(<PageError error={error} />)
        expect(screen.getByText(/Test Error/i)).toBeInTheDocument()
        expect(screen.getByText(/Oops/i)).toBeInTheDocument()
    })

    it('calls resetErrorBoundary when retry clicked', () => {
        const error = new Error('Test Error')
        const resetFn = vi.fn()
        render(<PageError error={error} resetErrorBoundary={resetFn} />)

        const retryBtn = screen.getByRole('button', { name: /Retry/i })
        fireEvent.click(retryBtn)

        expect(resetFn).toHaveBeenCalled()
    })
})
