
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import WordDetailModal from './WordDetailModal'
import { videoIndexService } from '../services/videoIndexService'
import { settingsService } from '../services/settingsService'
import { wordService } from '../services/wordService'


// Mock dependencies
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../services/videoIndexService', () => ({
    videoIndexService: {
        searchWord: vi.fn(),
    },
}))

vi.mock('../services/settingsService', () => ({
    settingsService: {
        getSettings: vi.fn(),
    },
}))

vi.mock('../services/wordService', () => ({
    wordService: {
        getWordBySpelling: vi.fn(),
        addWord: vi.fn(),
        updateWordStatus: vi.fn(),
    },
}))

vi.mock('../services/chineseDictionaryService', () => ({
    chineseDictionaryService: {
        getDefinition: vi.fn(),
    },
}))

vi.mock('../services/dictionaryService', () => ({
    dictionaryService: {
        getDefinition: vi.fn(),
    },
}))

describe('WordDetailModal Video Switching', () => {
    const mockWord = 'test'
    const mockClose = vi.fn()

    // Mock Word Data
    const mockDbWord = {
        id: 1,
        spelling: 'test',
        meaning: 'test meaning',
        status: 'Learning',
    }

    beforeEach(() => {
        vi.resetAllMocks()
            // Default mocks
            ; (wordService.getWordBySpelling as any).mockResolvedValue(mockDbWord)
            ; (settingsService.getSettings as any).mockResolvedValue({ videoSource: 'bilibili' })
    })

    it('should fetch video from youtube when setting is youtube', async () => {
        // Setup Youtube setting
        ; (settingsService.getSettings as any).mockResolvedValue({ videoSource: 'youtube' })

        // Setup Search Result
        const mockOccurrence = {
            bvid: 'dQw4w9WgXcQ',
            page: 1,
            title: 'Youtube Video',
            startTime: 10,
            context: 'video context',
            score: 10
        }
            ; (videoIndexService.searchWord as any).mockResolvedValue([mockOccurrence])

        render(<WordDetailModal word={mockWord} open={true} onClose={mockClose} />)

        await waitFor(() => {
            expect(settingsService.getSettings).toHaveBeenCalled()
            // Verify searchWord called with 'youtube' platform
            expect(videoIndexService.searchWord).toHaveBeenCalledWith('test', 'youtube')
        })

        // Verify Youtube Iframe Rendered
        // Youtube embed format: https://www.youtube.com/embed/{id}?start={time}
        // Verify Youtube Iframe Rendered
        // Youtube embed format: https://www.youtube.com/embed/{id}?start={time}
        // Note: mui Dialog might render in portal. using baseElement or querying by role inside document body is better.
        // Actually screen.getByRole can find it if visible.
    })

    it('should render correct youtube iframe src', async () => {
        ; (settingsService.getSettings as any).mockResolvedValue({ videoSource: 'youtube' })
        const mockOccurrence = {
            bvid: 'YT_ID',
            page: 1,
            title: 'Youtube Video',
            startTime: 30, // seconds
            context: 'video context'
        }
            ; (videoIndexService.searchWord as any).mockResolvedValue([mockOccurrence])

        render(<WordDetailModal word={mockWord} open={true} onClose={mockClose} />)

        await waitFor(() => {
            // Look for iframe with youtube src
            // Note: Material UI Dialog renders a portal. 
            // We can check if settingsService was called.
        })

        // Since we can't easily check iframe src in unit test without complex DOM queries (iframe is inside Material UI Box/Paper),
        // we mainly verify the *service call* which drives the data.
        // We will assume if data is fetched correctly, we just need to verify the conditionally rendered JSX paths essentially.

        expect(videoIndexService.searchWord).toHaveBeenCalledWith('test', 'youtube')

        // Verify iframe attributes - use findByTitle to wait for render
        const youtubeIframe = await screen.findByTitle('YouTube video player') as HTMLIFrameElement
        expect(youtubeIframe).toBeInTheDocument()
        expect(youtubeIframe.src).toContain('https://www.youtube.com/embed/YT_ID')
        expect(youtubeIframe.src).toContain('autoplay=1')
        expect(youtubeIframe.referrerPolicy).toBe('strict-origin-when-cross-origin')
    })
})
