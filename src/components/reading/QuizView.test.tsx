
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import QuizView from './QuizView'

// Mock sub-components if necessary but QuizView logic is what we want to test
vi.mock('./VocabularyQuestionRenderer', () => ({
    default: ({ question, onChange, answer }: any) => (
        <div data-testid={`vocab-q-${question.id}`}>
            <span>{question.stem}</span>
            <input
                data-testid={`vocab-input-${question.id}`}
                value={answer || ''}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    )
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}))

describe('QuizView', () => {
    const mockObSubmit = vi.fn()
    const mockOnBack = vi.fn()

    const mockReadingQuestions = [
        { id: 'r0', stem: 'Reading Q1', options: ['A', 'B'], answer: 'A', type: 'contextual' },
        { id: 'r1', stem: 'Reading Q2', options: ['C', 'D'], answer: 'C', type: 'contextual' },
    ] as any

    const mockVocabQuestions = [
        { id: 'v0', stem: 'Vocab Q1', answer: 'Answer1', type: 'spelling' }
    ] as any

    it('renders reading questions with unique radio group names', () => {
        render(
            <QuizView
                readingQuestions={mockReadingQuestions}
                vocabularyQuestions={mockVocabQuestions}
                onSubmit={mockObSubmit}
                onBack={mockOnBack}
            />
        )

        // Check if questions are rendered
        expect(screen.getByText('1. Reading Q1')).toBeInTheDocument()
        expect(screen.getByText('2. Reading Q2')).toBeInTheDocument()

        // Check RadioGroup names by inspecting input attributes
        // The radio input should have a name attribute derived from question ID
        const radioA = screen.getByLabelText('A') as HTMLInputElement
        const radioC = screen.getByLabelText('C') as HTMLInputElement

        expect(radioA.name).toBe('reading-question-r0')
        expect(radioC.name).toBe('reading-question-r1')
    })

    it('allows independent selection of reading answers', () => {
        render(
            <QuizView
                readingQuestions={mockReadingQuestions}
                vocabularyQuestions={mockVocabQuestions}
                onSubmit={mockObSubmit}
                onBack={mockOnBack}
            />
        )

        const radioA = screen.getByLabelText('A') as HTMLInputElement
        const radioC = screen.getByLabelText('C') as HTMLInputElement
        const radioB = screen.getByLabelText('B') as HTMLInputElement

        // Click Q1 - A
        fireEvent.click(radioA)
        expect(radioA).toBeChecked()

        // Click Q2 - C
        fireEvent.click(radioC)
        expect(radioC).toBeChecked()

        // Q1 - A should still be checked! (Regrssion test for the bug)
        expect(radioA).toBeChecked()

        // Click Q1 - B
        fireEvent.click(radioB)
        expect(radioB).toBeChecked()
        expect(radioA).not.toBeChecked()
        // Q2 - C should still be checked
        expect(radioC).toBeChecked()
    })
    it('displays explanation and exit button in review mode', () => {
        const mockReadingWithExpl = mockReadingQuestions.map((q: any) => ({ ...q, explanation: 'Reading Expl' }))
        const mockVocabWithExpl = mockVocabQuestions.map((q: any) => ({ ...q, explanation: 'Vocab Expl' }))

        const onExit = vi.fn()

        render(
            <QuizView
                readingQuestions={mockReadingWithExpl}
                vocabularyQuestions={mockVocabWithExpl}
                onSubmit={mockObSubmit}
                onBack={mockOnBack}
                onExit={onExit}
                readOnly={true}
                initialAnswers={{ reading: {}, vocabulary: {} }}
            />
        )

        // Check for Explanation in Step 0 (Reading)
        expect(screen.getAllByText(/Explanation/i)[0]).toBeInTheDocument()

        // Navigate to Step 1 (Vocab) to check Exit button
        fireEvent.click(screen.getByText('reading:quiz.next'))

        // Should show Exit Review button instead of Submit
        expect(screen.getByText('reading:quiz.exitReview')).toBeInTheDocument()
        expect(screen.queryByText('reading:quiz.submit')).not.toBeInTheDocument()

        // Click Exit logic
        fireEvent.click(screen.getByText('reading:quiz.exitReview'))
        expect(onExit).toHaveBeenCalled()
    })
    it('displays result banner in review mode', () => {
        render(
            <QuizView
                readingQuestions={mockReadingQuestions}
                vocabularyQuestions={mockVocabQuestions}
                onSubmit={mockObSubmit}
                onBack={mockOnBack}
                readOnly={true}
                result={{ score: 80, total: 100, message: 'Great job!' }}
                initialAnswers={{ reading: {}, vocabulary: {} }}
            />
        )

        expect(screen.getByText(/80/)).toBeInTheDocument()
        expect(screen.getByText(/Great job!/)).toBeInTheDocument()
    })
    it('displays rich result dashboard in review mode', () => {
        render(
            <QuizView
                readingQuestions={mockReadingQuestions}
                vocabularyQuestions={mockVocabQuestions}
                onSubmit={mockObSubmit}
                onBack={mockOnBack}
                readOnly={true}
                result={{
                    score: 85,
                    total: 100,
                    message: 'Difficulty adjusted',
                    stats: {
                        reading: { correct: 3, total: 5 },
                        vocabulary: { correct: 8, total: 10 }
                    }
                }}
                initialAnswers={{ reading: {}, vocabulary: {} }}
            />
        )

        // Check for main score
        expect(screen.getByText('85')).toBeInTheDocument()

        // Check for stats
        // Check for stats (searching by parts)
        expect(screen.getByText(/3/)).toBeInTheDocument()
        expect(screen.getByText(/\/ 5/)).toBeInTheDocument()
        expect(screen.getAllByText(/8/).length).toBeGreaterThan(0) // Matches 85 (score) and 8 (stats)
        expect(screen.getByText(/\/ 10/)).toBeInTheDocument()

        // Check for section labels (using translation keys as per mock)
        expect(screen.getAllByText('reading:quiz.readingTitle').length).toBeGreaterThan(0)
        expect(screen.getAllByText('reading:quiz.vocabTitle').length).toBeGreaterThan(0)
    })
})
