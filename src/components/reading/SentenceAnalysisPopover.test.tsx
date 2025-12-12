
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SentenceAnalysisPopover from './SentenceAnalysisPopover'

// Mock dependencies
const mockSettings = { apiKey: 'test', difficultyLevel: 'L2' } as any
const mockClose = vi.fn()
// Updated to return a Markdown string
const mockAnalyze = vi.fn().mockResolvedValue(`
## Translation
Fluent translation here.

## Structure
* Item 1
* Item 2
`)

vi.mock('../../services/llmService', () => ({
    llmService: {
        analyzeSentence: (...args: any[]) => mockAnalyze(...args)
    }
}))

vi.mock('../../services/analysisStorageService', () => ({
    analysisStorageService: {
        findMatchingAnalysis: vi.fn().mockResolvedValue(null),
        saveAnalysis: vi.fn().mockResolvedValue(1)
    }
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, def?: string) => {
            // Simple mock for t function
            if (key === 'button.retry') return 'Retry'
            if (key === 'common:error') return 'Error'
            return def || key
        }
    })
}))

describe('SentenceAnalysisPopover', () => {
    it('renders analysis markdown correctly after loading', async () => {
        render(
            <SentenceAnalysisPopover
                sentence="Hello world"
                anchorPosition={{ top: 100, left: 100 }}
                onClose={mockClose}
                settings={mockSettings}
                articleId="test-uuid"
            />
        )

        // Click Analyze button
        const analyzeBtn = screen.getByText('Analyze')
        fireEvent.click(analyzeBtn)

        // Wait for result
        await waitFor(() => {
            expect(screen.getByText('Translation')).toBeInTheDocument() // Header
        })

        expect(screen.getByText('Fluent translation here.')).toBeInTheDocument()
        expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    it('shows error state and retry button on failure', async () => {
        // Mock failure once
        mockAnalyze.mockRejectedValueOnce(new Error('API Error'))

        render(
            <SentenceAnalysisPopover
                sentence="Fail sentence"
                anchorPosition={{ top: 100, left: 100 }}
                onClose={mockClose}
                settings={mockSettings}
                articleId="test-uuid"
            />
        )

        fireEvent.click(screen.getByText('Analyze'))

        await waitFor(() => {
            expect(screen.getByText('Analysis failed. Please try again.')).toBeInTheDocument()
        })

        expect(screen.getByText('Retry')).toBeInTheDocument()
    })
})
