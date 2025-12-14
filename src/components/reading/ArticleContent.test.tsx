import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ArticleContent from './ArticleContent'

// Mock react-markdown to avoid complex parsing in tests
vi.mock('react-markdown', () => ({
    default: ({ components, children }: any) => {
        // Render simple span for testing
        if (components?.strong) {
            // Simulate 'strong' component usage for target words
            // In real app, we use markdown **word**
            // Here we just render children
            return <div data-testid="markdown-content">{children}</div>
        }
        return <div data-testid="markdown-content">{children}</div>
    }
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}))

describe('ArticleContent', () => {
    const mockOnWordClick = vi.fn()
    const mockOnSelection = vi.fn()
    const defaultProps = {
        title: 'Test Title',
        content: 'Test content with **target** word.',
        fontSize: 18,
        onWordClick: mockOnWordClick,
        onSelection: mockOnSelection,
        difficultyLevel: 'Level 2',
        wordCount: 120,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders title, content and metadata', () => {
        render(<ArticleContent {...defaultProps} />)
        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test content with **target** word.')).toBeInTheDocument()
        // Metadata
        expect(screen.getByText('Level 2')).toBeInTheDocument()
        expect(screen.getByText('reading:meta.wordCount')).toBeInTheDocument()
    })

    it('handles selection of text', () => {
        render(<ArticleContent {...defaultProps} />)

        const contentBox = screen.getByText('Test content with **target** word.').closest('div')
        // We attached onMouseUp to the container
        // But in test, we need to mock window.getSelection

        const mockGetSelection = vi.fn().mockReturnValue({
            toString: () => 'target',
            rangeCount: 1,
            getRangeAt: () => ({
                getBoundingClientRect: () => ({
                    bottom: 100,
                    left: 50,
                    width: 20
                })
            })
        })

        Object.defineProperty(window, 'getSelection', {
            writable: true,
            value: mockGetSelection
        })

        if (!contentBox) throw new Error('Content box not found')

        fireEvent.mouseUp(contentBox)

        expect(mockOnSelection).toHaveBeenCalledWith('target', {
            top: 100,
            left: 60 // 50 + 20/2
        })
    })

    it('ignores empty or multi-word selection', () => {
        render(<ArticleContent {...defaultProps} />)
        const contentBox = screen.getByText('Test content with **target** word.').closest('div')

        // Mock empty selection
        const mockGetSelectionEmpty = vi.fn().mockReturnValue({
            toString: () => '',
            rangeCount: 1,
            getRangeAt: () => ({ getBoundingClientRect: () => ({}) })
        })
        Object.defineProperty(window, 'getSelection', { value: mockGetSelectionEmpty })

        if (!contentBox) throw new Error('Content box not found')
        fireEvent.mouseUp(contentBox)
        expect(mockOnSelection).not.toHaveBeenCalled()

        // Mock multi-word selection (Now allowed for Sentence Analysis)
        const mockGetSelectionMulti = vi.fn().mockReturnValue({
            toString: () => 'two words',
            rangeCount: 1,
            getRangeAt: () => ({
                getBoundingClientRect: () => ({
                    bottom: 200,
                    left: 50,
                    width: 40
                })
            })
        })
        Object.defineProperty(window, 'getSelection', { value: mockGetSelectionMulti })

        fireEvent.mouseUp(contentBox)
        expect(mockOnSelection).toHaveBeenCalledWith('two words', {
            top: 200,
            left: 70 // 50 + 40/2
        })
    })
})
