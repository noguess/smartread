import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import DefinitionPopover from './DefinitionPopover'
import { dictionaryService } from '../../services/dictionaryService'
import { wordService } from '../../services/wordService'
import { chineseDictionaryService } from '../../services/chineseDictionaryService'

// Mock dependencies
vi.mock('../../services/dictionaryService', () => ({
    dictionaryService: {
        getDefinition: vi.fn()
    }
}))

vi.mock('../../services/wordService', () => ({
    wordService: {
        getWordBySpelling: vi.fn()
    }
}))

vi.mock('../../services/chineseDictionaryService', () => ({
    chineseDictionaryService: {
        getDefinition: vi.fn()
    }
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultVal: string) => defaultVal || key
    })
}))

describe('DefinitionPopover', () => {
    const mockOnClose = vi.fn()
    const mockOnDeepDive = vi.fn()
    const mockPosition = { top: 100, left: 100 }

    it('uses local DB definition if found', async () => {
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue({
            id: 1,
            spelling: 'test',
            meaning: '测试 (Local)',
            phonetic: '/test/',
            status: 'Learning',
            nextReviewAt: 0,
            interval: 0,
            repetitionCount: 0,
            lastSeenAt: 0
        })

        render(
            <DefinitionPopover
                word="test"
                anchorPosition={mockPosition}
                onClose={mockOnClose}
                onDeepDive={mockOnDeepDive}
            />
        )

        await waitFor(() => {
            expect(screen.getByText('测试 (Local)')).toBeInTheDocument()
        })
    })

    it('uses Chinese Dictionary Service if local not found', async () => {
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue(undefined)
        vi.mocked(chineseDictionaryService.getDefinition).mockResolvedValue({
            definition: '测试 (Service)',
            phonetic: '/test-svc/'
        })

        render(
            <DefinitionPopover
                word="test"
                anchorPosition={mockPosition}
                onClose={mockOnClose}
                onDeepDive={mockOnDeepDive}
            />
        )

        await waitFor(() => {
            expect(screen.getByText('测试 (Service)')).toBeInTheDocument()
        })
    })

    it('falls back to English Dictionary if Service returns null', async () => {
        vi.mocked(wordService.getWordBySpelling).mockResolvedValue(undefined)
        vi.mocked(chineseDictionaryService.getDefinition).mockResolvedValue(null)

        vi.mocked(dictionaryService.getDefinition).mockResolvedValue([{
            word: 'test',
            phonetic: '/en/',
            phonetics: [],
            meanings: [{
                partOfSpeech: 'n',
                definitions: [{ definition: 'English Def' }],
                synonyms: [],
                antonyms: []
            }],
            sourceUrls: []
        }] as any)

        render(
            <DefinitionPopover
                word="test"
                anchorPosition={mockPosition}
                onClose={mockOnClose}
                onDeepDive={mockOnDeepDive}
            />
        )

        await waitFor(() => {
            expect(screen.getByText('English Def')).toBeInTheDocument()
            const deepDiveBtn = screen.getByText('Deep Dive')
            fireEvent.click(deepDiveBtn)

            expect(mockOnDeepDive).toHaveBeenCalledWith('test')
        })
    })

    it('uses lemma from local DB if word not found', async () => {
        // Mock word miss
        vi.mocked(wordService.getWordBySpelling).mockImplementation(async (spelling) => {
            if (spelling === 'decided') return undefined
            if (spelling === 'decide') return {
                id: 2,
                spelling: 'decide',
                meaning: '决定 (Lemma)',
                phonetic: '/decide/',
                status: 'Learning',
                nextReviewAt: 0,
                interval: 0,
                repetitionCount: 0,
                lastSeenAt: 0
            }
            return undefined
        })

        render(
            <DefinitionPopover
                word="decided"
                anchorPosition={mockPosition}
                onClose={mockOnClose}
                onDeepDive={mockOnDeepDive}
            />
        )

        await waitFor(() => {
            expect(screen.getByText('决定 (Lemma)')).toBeInTheDocument()
        })
    })
})
