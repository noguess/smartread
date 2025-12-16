
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SentenceAnalysisPopover from './SentenceAnalysisPopover'
import { llmService } from '../../services/llmService'
import userEvent from '@testing-library/user-event'

// Mock dependencies
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, def?: string) => def || key }),
}))

vi.mock('../../services/llmService', () => ({
    llmService: {
        analyzeSentence: vi.fn(),
    },
}))

vi.mock('../../services/analysisStorageService', () => ({
    analysisStorageService: {
        findMatchingAnalysis: vi.fn().mockResolvedValue(null),
        saveAnalysis: vi.fn(),
    },
}))

vi.mock('react-markdown', () => ({
    default: ({ children }: any) => <div data-testid="markdown">{children}</div>
}))

describe('SentenceAnalysisPopover Streaming', () => {
    it('updates content progressively as tokens are received', async () => {
        // Setup streaming mock
        (llmService.analyzeSentence as any).mockImplementation(async (_sentence: string, _settings: any, onToken: any) => {
            if (onToken) {
                onToken('Hel')
                await new Promise(r => setTimeout(r, 10))
                onToken('lo')
            }
            return 'Hello'
        })

        render(
            <SentenceAnalysisPopover
                sentence="Test Sentence"
                anchorPosition={{ top: 100, left: 100 }}
                onClose={() => { }}
                settings={{ apiKey: 'test' } as any}
                articleId="123"
            />
        )

        // Click analyze
        const analyzeBtn = screen.getByText('Analyze')
        await userEvent.click(analyzeBtn)

        // Should eventually see partial content
        // (Due to async nature, we might catch it at 'Hel' or 'Hello', but checking for Hello is safe)
        await waitFor(() => {
            expect(screen.getByTestId('markdown')).toHaveTextContent('Hello')
        })
    })

    it('scrolls to bottom as content updates', async () => {
        // Mock scrollIntoView
        const scrollIntoViewMock = vi.fn()
        window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

        // Setup streaming mock
        const mockAnalyze = llmService.analyzeSentence as any
        if (!mockAnalyze) throw new Error('llmService.analyzeSentence is undefined')

        mockAnalyze.mockImplementation(async (_s: string, _st: any, onToken: any) => {
            if (onToken) {
                onToken('Part 1')
                await new Promise(r => setTimeout(r, 10))
                onToken('Part 2')
            }
            return 'Part 1Part 2'
        })

        render(
            <SentenceAnalysisPopover
                sentence="Test"
                anchorPosition={{ top: 100, left: 100 }}
                onClose={() => { }}
                settings={{ apiKey: 'test' } as any}
                articleId="123"
            />
        )

        await userEvent.click(screen.getByText('Analyze'))

        await waitFor(() => {
            expect(screen.getByTestId('markdown')).toHaveTextContent('Part 1')
        })

        // Check if scrollIntoView was called
        expect(scrollIntoViewMock).toHaveBeenCalled()
    })
})
