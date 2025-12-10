import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QuizHistoryPage from './QuizHistoryPage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { quizRecordService } from '../../services/quizRecordService'
import { articleService } from '../../services/articleService'

// Service Mocks
vi.mock('../../services/quizRecordService')
vi.mock('../../services/articleService')

// I18n Mock
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

describe('QuizHistoryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(quizRecordService.getAll).mockResolvedValue([])
        vi.mocked(articleService.getAll).mockResolvedValue([])
    })

    const renderWithRouter = (state?: any) => {
        return render(
            <MemoryRouter initialEntries={[{ pathname: '/history', state }]}>
                <Routes>
                    <Route path="/history" element={<QuizHistoryPage />} />
                </Routes>
            </MemoryRouter>
        )
    }

    it('shows snackbar error from navigation state', async () => {
        const errorMsg = 'Failed to load review'
        renderWithRouter({ error: errorMsg })

        // Should see loading then empty state
        await waitFor(() => {
            expect(screen.getByText('history:noRecords')).toBeInTheDocument()
        })

        // Check for Snackbar Alert
        await waitFor(() => {
            // Material UI Alert usually has these roles
            expect(screen.getByRole('alert')).toHaveTextContent(errorMsg)
        })
    })
})
