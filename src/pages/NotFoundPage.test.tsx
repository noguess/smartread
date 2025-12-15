import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import NotFoundPage from './NotFoundPage'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

describe('NotFoundPage', () => {
    it('renders 404 message', () => {
        render(
            <BrowserRouter>
                <NotFoundPage />
            </BrowserRouter>
        )
        expect(screen.getByText(/404/i)).toBeInTheDocument()
        expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument()
    })

    it('navigates to home when button clicked', () => {
        render(
            <BrowserRouter>
                <NotFoundPage />
            </BrowserRouter>
        )
        const homeBtn = screen.getByRole('button', { name: /Back to Home/i })
        fireEvent.click(homeBtn)

        expect(mockNavigate).toHaveBeenCalledWith('/')
    })
})
