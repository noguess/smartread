import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ManualGenerationDialog from './ManualGenerationDialog'

// Mock Translations
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

// Mock MUI Autocomplete (since it's complex to test fully in jsdom sometimes)
// But we should try to test the real one if possible, or partially mock behavior.
// For integration test, let's try real component first. If flaky, we mock.

const mockWords = [
    { id: 1, spelling: 'apple', status: 'New', meaning: 'fruit' },
    { id: 2, spelling: 'banana', status: 'Learning', meaning: 'fruit' },
    { id: 3, spelling: 'cherry', status: 'Mastered', meaning: 'fruit' }
] as any

describe('ManualGenerationDialog', () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        onGenerate: vi.fn(),
        allWords: mockWords
    }

    it('renders dialog correctly', () => {
        render(<ManualGenerationDialog {...defaultProps} />)
        expect(screen.getByText('home:manual.title')).toBeInTheDocument()
    })

    // This test will fail currently as we haven't implemented Autocomplete yet
    it('filters words in autocomplete and adds on selection', () => {
        render(<ManualGenerationDialog {...defaultProps} />)

        // Find the input (currently it's a TextField, later Autocomplete)
        // With Autocomplete, the role is usually 'combobox'
        // For now, let's just write the test expecting the behavior we want to implement.

        // We expect an input that allows typing
        const input = screen.getByPlaceholderText('home:manual.searchPlaceholder')

        // Type 'app'
        fireEvent.change(input, { target: { value: 'app' } })

        // In Autocomplete, this should trigger dropdown. 
        // We will look for 'apple' in the document (dropdown portal)
        // Note: verify this logic after implementing Autocomplete

        // Simulate selection (depends on implementation)
    })
})
