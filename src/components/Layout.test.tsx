
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Layout from './Layout'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
            changeLanguage: vi.fn(),
        },
    }),
}))

const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches: matches,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    })
}

// Create a theme instance
const theme = createTheme()

describe('Layout Component Responsive', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const renderLayout = () => {
        return render(
            <ThemeProvider theme={theme}>
                <BrowserRouter>
                    <Layout>
                        <div>Test Content</div>
                    </Layout>
                </BrowserRouter>
            </ThemeProvider>
        )
    }

    it('shows permanent drawer and no menu button on desktop', () => {
        // Desktop: matches = false (because down('lg') is false for desktop)
        mockMatchMedia(false)

        renderLayout()

        // Sidebar content should be visible
        expect(screen.getByText('common:nav.home')).toBeVisible()

        // Menu button should NOT be visible
        const menuButton = screen.queryByLabelText('open drawer')
        expect(menuButton).not.toBeInTheDocument()
    })

    it('shows menu button and temporary drawer logic on tablet/mobile', () => {
        // Mobile: matches = true
        mockMatchMedia(true)

        renderLayout()

        // Menu button should be present
        const menuButton = screen.getByLabelText('open drawer')
        expect(menuButton).toBeInTheDocument()

        // Click to open
        fireEvent.click(menuButton)

        // Sidebar content should be visible
        expect(screen.getByText('common:nav.home')).toBeVisible()
    })
})
