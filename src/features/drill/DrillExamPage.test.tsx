import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import DrillExamPage from './DrillExamPage'
import { MemoryRouter } from 'react-router-dom'
import { speechService } from '../../services/speechService'
import { llmService } from '../../services/llmService'
import { wordService } from '../../services/wordService'

// Mocking 
vi.mock('../../services/speechService', () => ({
    speechService: {
        startListening: vi.fn(),
        stopListening: vi.fn(),
        abort: vi.fn()
    }
}))

vi.mock('../../services/llmService', () => ({
    llmService: {
        batchGradeTranslations: vi.fn()
    }
}))

vi.mock('../../services/settingsService', () => ({
    settingsService: {
        getSettings: vi.fn().mockResolvedValue({ apiKey: 'test' })
    }
}))

vi.mock('../../services/wordService', () => ({
    wordService: {
        updateWord: vi.fn()
    }
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => ({
    ...((await vi.importActual('react-router-dom')) as any),
    useNavigate: () => mockNavigate,
}))

describe('DrillExamPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const words = [{ id: 1, spelling: 'apple', meaning: '苹果' }]

    const renderPage = () => render(
        <MemoryRouter initialEntries={[{ state: { words } }]}>
            <DrillExamPage />
        </MemoryRouter>
    )

    it('renders exam title and first step', () => {
        renderPage()
        expect(screen.getByText('exam.title')).toBeDefined()
        expect(screen.getByText('exam.step_1_title')).toBeDefined()
    })

    it('handles step 1 (Reading) and transitions to step 2 (Meaning)', async () => {
        renderPage()
        fireEvent.click(screen.getByLabelText('mic'))

        await waitFor(() => expect(speechService.startListening).toHaveBeenCalled())

        // Step 1: Speak English
        const startCall = (speechService.startListening as any).mock.calls[0]
        expect(startCall[0]).toBe('en-US')

        // Finalize speech
        startCall[1]({ transcript: 'apple', isFinal: true })

        await waitFor(() => {
            expect(screen.getByText('exam.step_2_title')).toBeDefined()
        })
    })

    it('handles batch grading and shows summary after final step', async () => {
        renderPage()

        // Step 1
        fireEvent.click(screen.getByLabelText('mic'))
        await waitFor(() => expect(speechService.startListening).toHaveBeenCalled())
        const call1 = (speechService.startListening as any).mock.calls[0]
        call1[1]({ transcript: 'apple', isFinal: true })

        // Step 2
        await waitFor(() => screen.getByText('exam.step_2_title'))
        fireEvent.click(screen.getByLabelText('mic'))
        await waitFor(() => expect(speechService.startListening).toHaveBeenCalledTimes(2))
        const call2 = (speechService.startListening as any).mock.calls[1]
        expect(call2[0]).toBe('zh-CN')

        // Mock LLM result
        llmService.batchGradeTranslations = vi.fn().mockResolvedValue([{ word: 'apple', score: 100 }])

        call2[1]({ transcript: '苹果', isFinal: true })

        // Should show grading then summary
        await waitFor(() => {
            expect(screen.getByText('exam.exam_perfect')).toBeDefined()
        }, { timeout: 4000 })

        expect(wordService.updateWord).toHaveBeenCalled()
    })
})
