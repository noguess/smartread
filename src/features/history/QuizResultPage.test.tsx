
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QuizResultPage from './QuizResultPage'
import { db } from '../../services/db'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Mock dependencies
vi.mock('../../services/db', () => ({
    db: {
        quizRecords: {
            get: vi.fn()
        }
    }
}))
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

// Wrapper to provide router with params
const renderWithRouter = (id: string = '1') => {
    return render(
        <MemoryRouter initialEntries={[`/history/${id}`]}>
            <Routes>
                <Route path="/history/:id" element={<QuizResultPage />} />
                <Route path="/history" element={<div>History List</div>} />
            </Routes>
        </MemoryRouter>
    )
}

describe('QuizResultPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading state initially', () => {
        vi.mocked(db.quizRecords.get).mockReturnValue(new Promise(() => { }))
        renderWithRouter('1')
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('renders not found state if record does not exist', async () => {
        vi.mocked(db.quizRecords.get).mockResolvedValue(undefined)
        renderWithRouter('999')

        await waitFor(() => {
            expect(screen.getByText('Record not found')).toBeInTheDocument()
        })
    })

    it('renders record details correctly', async () => {
        const mockRecord: any = {
            id: 1,
            score: 90,
            timeSpent: 120,
            questions: {
                readingQuestions: [
                    { id: 'r1', stem: 'Reading Q1', answer: 'A', options: ['A', 'B'] }
                ],
                vocabularyQuestions: []
            },
            userAnswers: {
                reading: { r1: 'A' }
            }
        }
        vi.mocked(db.quizRecords.get).mockResolvedValue(mockRecord)

        renderWithRouter('1')

        await waitFor(() => {
            expect(screen.getByText('history:quizResult')).toBeInTheDocument()
            expect(screen.getByText('90')).toBeInTheDocument()
            expect(screen.getByText('2m 0s')).toBeInTheDocument()
            expect(screen.getByText('Reading Q1')).toBeInTheDocument()
        })
    })

    it('renders review cards with user answers', async () => {
        const mockRecord: any = {
            id: 1,
            score: 0,
            questions: {
                reading: [
                    { id: 'r1', stem: 'Question 1 Stem', answer: 'A', options: ['A', 'B'], explanation: 'Because A' }
                ]
            },
            userAnswers: {
                reading: { r1: 'B' } // Wrong answer
            }
        }
        vi.mocked(db.quizRecords.get).mockResolvedValue(mockRecord)

        renderWithRouter('1')

        await waitFor(() => {
            expect(screen.getByText('Question 1 Stem')).toBeInTheDocument()
            // Check for wrong answer indication
            expect(screen.getByText(/Correct Answer/)).toBeInTheDocument()
            expect(screen.getByText(/Your Answer/)).toBeInTheDocument()
        })
    })

    it('navigates back to history list', async () => {
        vi.mocked(db.quizRecords.get).mockResolvedValue(undefined)
        renderWithRouter('999')

        await waitFor(() => {
            expect(screen.getByText('Record not found')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Back'))
        expect(screen.getByText('History List')).toBeInTheDocument()
    })
})
