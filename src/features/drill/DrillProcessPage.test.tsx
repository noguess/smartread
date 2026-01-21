import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import DrillProcessPage from './DrillProcessPage'
import { MemoryRouter } from 'react-router-dom'
import { speechService } from '../../services/speechService'

// Mocking 
vi.stubGlobal('SpeechSynthesisUtterance', class {
    lang = ''
    rate = 1
})
vi.stubGlobal('speechSynthesis', {
    speak: vi.fn(),
    cancel: vi.fn()
})

vi.mock('../../services/speechService', () => ({
    speechService: {
        startListening: vi.fn(),
        stopListening: vi.fn(),
        abort: vi.fn()
    }
}))

vi.mock('../../services/llmService', () => ({
    llmService: {
        gradeTranslation: vi.fn()
    }
}))

vi.mock('../../services/settingsService', () => ({
    settingsService: {
        getSettings: vi.fn().mockResolvedValue({ apiKey: 'test' })
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

describe('DrillProcessPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const words = [{ id: 1, spelling: 'apple', meaning: '苹果', contextSentence: 'I eat apple' }]

    const renderPage = () => render(
        <MemoryRouter initialEntries={[{ state: { words } }]}>
            <DrillProcessPage />
        </MemoryRouter>
    )

    it('renders the first word and shows round title', () => {
        renderPage()
        expect(screen.getByText('apple')).toBeDefined()
        expect(screen.getByText('process.round1_title')).toBeDefined()
    })

    it('starts listening when microphone button is clicked', async () => {
        renderPage()
        const micBtn = screen.getByLabelText('mic')
        fireEvent.click(micBtn)

        await waitFor(() => {
            expect(speechService.startListening).toHaveBeenCalled()
        })
    })

    it('handles correct speech input in round 1 and shows feedback', async () => {
        renderPage()
        fireEvent.click(screen.getByLabelText('mic'))

        await waitFor(() => expect(speechService.startListening).toHaveBeenCalled())

        // Simulate successful result
        const callback = (speechService.startListening as any).mock.calls[0][1]

        await act(async () => {
            callback({ transcript: 'apple', isFinal: true })
        })

        await waitFor(() => {
            const results = screen.queryAllByText(/excellent/)
            expect(results.length).toBeGreaterThan(0)
        }, { timeout: 10000 })
    })
})
