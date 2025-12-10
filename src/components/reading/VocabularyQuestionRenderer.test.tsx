
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import VocabularyQuestionRenderer from './VocabularyQuestionRenderer'

// Mock TTS service
vi.mock('../../services/ttsService', () => ({
    ttsService: {
        isSupported: () => true,
        playWord: vi.fn()
    }
}))

describe('VocabularyQuestionRenderer', () => {
    const mockOnChange = vi.fn()

    it('renders multiple_choice type correctly by normalizing to contextual/definition', () => {
        // Case 1: multiple_choice -> definition
        const questionDef = {
            id: 'v1',
            type: 'multiple_choice',
            subType: 'definition',
            stem: 'Def Q',
            options: ['Opt1', 'Opt2'],
            answer: 'Opt1'
        } as any

        const { rerender } = render(
            <VocabularyQuestionRenderer
                question={questionDef}
                answer=""
                onChange={mockOnChange}
                index={0}
            />
        )

        // Should render radio buttons
        expect(screen.getByText(/Def Q/)).toBeInTheDocument()
        expect(screen.getByLabelText('Opt1')).toBeInTheDocument()
        expect(screen.getByLabelText('Opt2')).toBeInTheDocument()

        // Case 2: multiple_choice -> contextual (default)
        const questionCtx = {
            id: 'v2',
            type: 'multiple_choice',
            subType: 'contextual', // or explicit
            stem: 'Ctx Q',
            options: ['A', 'B'],
            answer: 'A'
        } as any

        rerender(
            <VocabularyQuestionRenderer
                question={questionCtx}
                answer=""
                onChange={mockOnChange}
                index={1}
            />
        )
        expect(screen.getByText(/Ctx Q/)).toBeInTheDocument()
        expect(screen.getByLabelText('A')).toBeInTheDocument()
    })

    it('renders input type correctly by normalizing to spelling/wordForm', () => {
        // Case 1: input -> word_form
        const questionInput = {
            id: 'v3',
            type: 'input',
            subType: 'word_form',
            stem: 'Input Q',
            answer: 'test',
            hint: 'Root: test'
        } as any

        render(
            <VocabularyQuestionRenderer
                question={questionInput}
                answer=""
                onChange={mockOnChange}
                index={2}
            />
        )

        // Should render TextField
        expect(screen.getByText(/Input Q/)).toBeInTheDocument()
        expect(screen.getByText(/Hint: Root: test/)).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument()
    })

    it('renders unknown type gracefully or with error', () => {
        const questionUnknown = {
            id: 'v4',
            type: 'weird_type',
            stem: 'Unknown Q',
        } as any

        render(
            <VocabularyQuestionRenderer
                question={questionUnknown}
                answer=""
                onChange={mockOnChange}
                index={3}
            />
        )

        expect(screen.getByText(/Unknown question type: weird_type/i)).toBeInTheDocument()
    })
    it('renders audio type correctly by normalizing', () => {
        const questionAudio = {
            id: 'v5',
            type: 'input',
            subType: 'audio',
            stem: 'Audio Q',
            phonetic: '/test/',
            answer: 'test'
        } as any

        render(
            <VocabularyQuestionRenderer
                question={questionAudio}
                answer=""
                onChange={mockOnChange}
                index={4}
            />
        )

        // Should show "Click to play audio" or Volume icon
        expect(screen.getByText(/Click to play audio/i)).toBeInTheDocument()
    })
    it('displays explanation in readOnly mode', () => {
        const question = {
            id: 'v6',
            type: 'spelling',
            stem: 'Test Q',
            answer: 'ans',
            explanation: 'Because rules.'
        } as any

        render(
            <VocabularyQuestionRenderer
                question={question}
                answer="ans"
                onChange={mockOnChange}
                index={5}
                readOnly={true}
            />
        )

        // Should show Explanation section
        expect(screen.getByText(/Explanation/i)).toBeInTheDocument()
    })
})
