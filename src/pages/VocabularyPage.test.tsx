import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import VocabularyPage from './VocabularyPage'
import { wordService } from '../services/wordService'

// Mock dependencies
vi.mock('../services/wordService')
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))
vi.mock('../components/WordDetailModal', () => ({ default: () => <div data-testid="word-detail-modal" /> }))
vi.mock('../components/common', () => ({
    EmptyState: () => <div data-testid="empty-state" />,
    StyledCard: ({ children }: any) => <div>{children}</div>,
    StatusBadge: () => <div />,
    PageLoading: () => <div data-testid="page-loading">Loading...</div>,
    PageError: () => <div data-testid="page-error">Error</div>
}))

describe('VocabularyPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows loading state initially', async () => {
        // Mock a slow promise to simulate loading
        vi.mocked(wordService.getAllWords).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)))

        render(<VocabularyPage />)

        // Should show loading initially
        expect(screen.getByTestId('page-loading')).toBeInTheDocument()

        // Wait for finish
        await waitFor(() => {
            expect(screen.queryByTestId('page-loading')).not.toBeInTheDocument()
        })
    })

    it('shows error state when data fetch fails', async () => {
        vi.mocked(wordService.getAllWords).mockRejectedValue(new Error('Fetch Failed'))

        render(<VocabularyPage />)

        // Should show error
        await waitFor(() => {
            expect(screen.getByTestId('page-error')).toBeInTheDocument()
        })
    })
})
