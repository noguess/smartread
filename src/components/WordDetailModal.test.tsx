import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import WordDetailModal from './WordDetailModal'
import { wordService } from '../services/wordService'
import { dictionaryService } from '../services/dictionaryService'
import { chineseDictionaryService } from '../services/chineseDictionaryService'

// Mock dependencies
vi.mock('../services/wordService', () => ({
    wordService: {
        getWordBySpelling: vi.fn(),
        addWord: vi.fn(),
        updateWordStatus: vi.fn()
    }
}))

vi.mock('../services/dictionaryService', () => ({
    dictionaryService: {
        getDefinition: vi.fn()
    }
}))

vi.mock('../services/chineseDictionaryService', () => ({
    chineseDictionaryService: {
        getDefinition: vi.fn()
    }
}))

vi.mock('../services/videoIndexService', () => ({
    videoIndexService: {
        searchWord: vi.fn().mockResolvedValue([])
    }
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

describe('WordDetailModal', () => {
    const mockOnClose = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders nothing when closed', () => {
        render(<WordDetailModal word="test" open={false} onClose={mockOnClose} />)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('loads word from DB if exists', async () => {
        const mockWord = {
            id: 1,
            spelling: 'test',
            meaning: 'test meaning',
            phonetic: '/test/',
            status: 'Mastered',
            nextReviewAt: 0,
            interval: 1,
            repetitionCount: 1,
            lastSeenAt: 0
        }
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue(mockWord as any)

        render(<WordDetailModal word="test" open={true} onClose={mockOnClose} />)

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        await waitFor(() => {
            expect(screen.getByText('test meaning')).toBeInTheDocument()
            expect(screen.getByText('/test/')).toBeInTheDocument()
            expect(screen.getByText('Mastered')).toBeInTheDocument()
        })
        expect(dictionaryService.getDefinition).not.toHaveBeenCalled()
    })

    it('auto-fetches from dictionary and saves if word not in DB', async () => {
        // Mock DB miss
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue(undefined)

        // Mock Dictionary hit
        const mockDictEntry = {
            word: 'test',
            phonetics: [{ text: '/test-api/' }],
            meanings: [
                {
                    partOfSpeech: 'n',
                    definitions: [{ definition: 'api definition', synonyms: [], antonyms: [] }],
                    synonyms: [],
                    antonyms: []
                }
            ],
            sourceUrls: []
        }
        vi.mocked(dictionaryService.getDefinition).mockResolvedValue([mockDictEntry as any])
        vi.mocked(wordService.addWord).mockResolvedValue(123)

        render(<WordDetailModal word="test" open={true} onClose={mockOnClose} />)

        expect(screen.getByRole('dialog')).toBeInTheDocument()

        // Should call dictionary service
        await waitFor(() => {
            expect(dictionaryService.getDefinition).toHaveBeenCalledWith('test')
        })

        // Should call addWord
        await waitFor(() => {
            expect(wordService.addWord).toHaveBeenCalledWith(expect.objectContaining({
                spelling: 'test',
                status: 'Learning',
                phonetic: '/test-api/'
            }))
        })

        // Should update UI with new word data (implied by state update)
        // Since we update state immediately in the component, we can check for text
        await waitFor(() => {
            expect(screen.getByText('n. api definition')).toBeInTheDocument()
        })
    })

    it('handles dictionary fetch failure gracefully', async () => {
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue(undefined)
        vi.mocked(dictionaryService.getDefinition).mockRejectedValue(new Error('API Error'))

        render(<WordDetailModal word="test" open={true} onClose={mockOnClose} />)

        await waitFor(() => {
            expect(dictionaryService.getDefinition).toHaveBeenCalled()
        })
        // Should eventually stop loading (we could verify loading state gone, but usually we verify no crash)
        expect(screen.queryByText('API Error')).not.toBeInTheDocument() // Ensure we don't flash raw error
    })
    it('uses lemma for DB lookup and saving', async () => {
        // Input: "decided" (Conjugated)
        // Expected Lemma: "decide"

        // Mock DB: "decide" not found initially
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue(undefined)

        // Mock Dictionary: Returns data for "decide"
        const mockDictEntry = {
            word: 'decide',
            phonetics: [{ text: '/dɪˈsaɪd/' }],
            meanings: [{ partOfSpeech: 'v', definitions: [{ definition: 'To choose' }] }],
            sourceUrls: []
        }
        vi.mocked(dictionaryService.getDefinition).mockResolvedValue([mockDictEntry as any])
        vi.mocked(wordService.addWord).mockResolvedValue(999)

        render(<WordDetailModal word="decided" open={true} onClose={mockOnClose} />)

        await waitFor(() => {
            // Should verify that we looked up 'decide' (Lemma), NOT 'decided'
            expect(wordService.getWordBySpelling).toHaveBeenCalledWith('decide')
        })

        await waitFor(() => {
            // Should fetch dictionary for 'decide'
            expect(dictionaryService.getDefinition).toHaveBeenCalledWith('decide')
        })

        await waitFor(() => {
            // Should save 'decide'
            expect(wordService.addWord).toHaveBeenCalledWith(expect.objectContaining({
                spelling: 'decide'
            }))
        })
    })

    it('prioritizes Chinese dictionary and saves with Chinese definition', async () => {
        // Mock DB miss
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue(undefined)

        // Mock Chinese Dict Hit
        vi.mocked(chineseDictionaryService.getDefinition).mockResolvedValue({
            definition: '测试释义',
            phonetic: '/test-chn/'
        })
        vi.mocked(wordService.addWord).mockResolvedValue(1001)

        render(<WordDetailModal word="test" open={true} onClose={mockOnClose} />)

        expect(screen.getByRole('dialog')).toBeInTheDocument()

        await waitFor(() => {
            expect(chineseDictionaryService.getDefinition).toHaveBeenCalledWith('test')
        })

        await waitFor(() => {
            // Should save with Chinese info
            expect(wordService.addWord).toHaveBeenCalledWith(expect.objectContaining({
                spelling: 'test',
                meaning: '测试释义',
                phonetic: '/test-chn/'
            }))
        })
    })
    it('shows error state when manual dictionary check fails', async () => {
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue({
            id: 1, spelling: 'test', status: 'Learning'
        } as any)

        // Mock Dictionary failure
        vi.mocked(dictionaryService.getDefinition).mockRejectedValue(new Error('Network Error'))

        render(<WordDetailModal word="test" open={true} onClose={mockOnClose} />)

        // Wait for word to load
        await waitFor(() => expect(screen.getByText('test')).toBeInTheDocument())

        // Click "Check Dictionary"
        const checkBtn = screen.getByText('vocabulary:modal.checkDictionary')
        fireEvent.click(checkBtn)

        // Wait for Error Feedback
        await waitFor(() => {
            expect(screen.getByText('vocabulary:modal.error.network')).toBeInTheDocument()
        })
    })
})
