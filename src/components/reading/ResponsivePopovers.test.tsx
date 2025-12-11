
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DefinitionPopover from './DefinitionPopover'
import SentenceAnalysisPopover from './SentenceAnalysisPopover'
import { ThemeProvider, createTheme } from '@mui/material/styles'

// Mock dictionary/LLM services to avoid errors
vi.mock('../../services/dictionaryService', () => ({
    dictionaryService: {
        getDefinition: vi.fn().mockResolvedValue([])
    }
}))
vi.mock('../../services/wordService', () => ({
    wordService: {
        getWordBySpelling: vi.fn().mockResolvedValue(null)
    }
}))
vi.mock('../../services/chineseDictionaryService', () => ({
    chineseDictionaryService: {
        getDefinition: vi.fn().mockResolvedValue(null)
    }
}))
vi.mock('../../services/llmService', () => ({
    llmService: {
        analyzeSentence: vi.fn()
    }
}))
vi.mock('../../services/analysisStorageService', () => ({
    analysisStorageService: {
        findMatchingAnalysis: vi.fn()
    }
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

const theme = createTheme()

// Helper to mock screen width
const setScreenSize = (isMobile: boolean) => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: isMobile, // Simply force match for test simplicity. Real logic would parse query.
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }))
}

describe('Responsive Popovers', () => {
    const defaultProps = {
        anchorPosition: { top: 100, left: 100 },
        onClose: vi.fn(),
    }

    // Position for Popover checking (MUI Popover usually renders a div with role presentation/dialog at specific coordinates)
    // Drawer renders at bottom.

    it('renders DefinitionPopover as Popover on Desktop', () => {
        setScreenSize(false) // Desktop

        render(
            <ThemeProvider theme={theme}>
                <DefinitionPopover {...defaultProps} word="test" onDeepDive={vi.fn()} />
            </ThemeProvider>
        )

        // Popover presentation
        // In MUI V5, Popover creates a Modal -> Backdrop + Paper
        // Drawer also creates a Modal.
        // Distinction: Popover sets 'top/left' styles on the Paper based on anchor.
        // Drawer (bottom) sets 'bottom: 0, left: 0, right: 0' and usually has class MuiDrawer-paperAnchorBottom

        const paper = screen.getByRole('presentation').querySelector('.MuiPaper-root')
        expect(paper).not.toBeNull()

        // Check for Popover-specific positioning style (top/left should be present)
        // or ensure it DOES NOT have Drawer classes
        expect(paper?.className).not.toContain('MuiDrawer-paper')
        // Popover paper usually has `position: absolute` or `fixed` relative to anchor.
    })

    it('renders DefinitionPopover as BottomSheet (Drawer) on Mobile', () => {
        setScreenSize(true) // Mobile

        render(
            <ThemeProvider theme={theme}>
                <DefinitionPopover {...defaultProps} word="test" onDeepDive={vi.fn()} />
            </ThemeProvider>
        )

        // Wrapper check
        const wordText = screen.getByText('test')
        expect(wordText).toBeInTheDocument()

        // Find the Paper element containing the text
        // In a Drawer, the paper is usually having a specific class or style (bottom: 0)
        // We look for MuiDrawer-paper
        const paper = document.querySelector('.MuiDrawer-paper')
        expect(paper).toBeInTheDocument()
    })

    it('renders SentenceAnalysisPopover as BottomSheet (Drawer) on Mobile', () => {
        setScreenSize(true) // Mobile

        render(
            <ThemeProvider theme={theme}>
                <SentenceAnalysisPopover {...defaultProps} sentence="Test sentence" settings={{} as any} articleId="1" />
            </ThemeProvider>
        )

        // Since i18n is mocked, we expect the KEY
        const title = screen.getByText('status.sentenceAnalysis')
        expect(title).toBeInTheDocument()

        const paper = document.querySelector('.MuiDrawer-paper')
        if (!paper) {
            console.error('DEBUG HTML:', document.body.innerHTML)
        }
        expect(paper).toBeInTheDocument()
    })
})
