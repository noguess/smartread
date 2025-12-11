
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ArticleContent from './ArticleContent'

// Mock styles since we use css modules
vi.mock('../../styles/reading.module.css', () => ({
    default: {
        articleContent: 'articleContent',
        articleContainer: 'articleContainer'
    }
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

describe('ArticleContent Interaction', () => {
    // Mock getSelection
    const mockGetSelection = vi.fn()
    Object.defineProperty(window, 'getSelection', {
        value: mockGetSelection
    })

    const defaultProps = {
        title: 'Test Title',
        content: 'Some test content for reading.',
        fontSize: 'medium' as const,
        onSelection: vi.fn()
    }

    it('prevents default context menu on content area', () => {
        render(<ArticleContent {...defaultProps} />)

        const contentArea = screen.getByText('Some test content for reading.').closest('div')
        expect(contentArea).toBeTruthy()

        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        // Use fireEvent which wraps for React
        fireEvent(contentArea!, event)

        expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('triggers selection on touch end', () => {
        render(<ArticleContent {...defaultProps} />)

        const contentArea = screen.getByText('Some test content for reading.').closest('div')

        // Mock selection behavior
        mockGetSelection.mockReturnValue({
            rangeCount: 1,
            toString: () => 'content',
            getRangeAt: () => ({
                getBoundingClientRect: () => ({ bottom: 100, left: 100, width: 50 })
            })
        })

        fireEvent.touchEnd(contentArea!)

        expect(defaultProps.onSelection).toHaveBeenCalledWith('content', expect.any(Object))
    })
})
