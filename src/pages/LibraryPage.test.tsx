import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LibraryPage from './LibraryPage'
import { articleService } from '../services/articleService'
import { quizRecordService } from '../services/quizRecordService'
import { MemoryRouter } from 'react-router-dom'

const { mockGetPage, mockDelete, mockGetAll } = vi.hoisted(() => {
    return {
        mockGetPage: vi.fn(),
        mockDelete: vi.fn(),
        mockGetAll: vi.fn()
    }
})

vi.mock('../services/articleService', () => ({
    articleService: {
        getAll: mockGetAll,
        getPage: mockGetPage,
        delete: mockDelete
    }
}))

vi.mock('../services/quizRecordService', () => ({
    quizRecordService: {
        getRecordsByArticleUuid: vi.fn()
    }
}))

// Mock Translations
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'library:tabs.all') return '全部'
            if (key === 'library:tabs.progress') return '进行中'
            if (key === 'library:tabs.finished') return '已完成'
            if (key === 'library:title') return '我的阅读列表'
            if (key === 'library:delete.title') return 'Delete Article'
            if (key === 'library:delete.message') return 'Are you sure you want to delete this article? This action cannot be undone.'
            if (key === 'common:button.delete') return 'Delete'
            if (key === 'common:button.cancel') return 'Cancel'
            if (key === 'common:button.load_more') return '加载更多...'
            return key
        }
    })
}))

const mockArticles = [
    {
        id: 1,
        uuid: 'uuid-1',
        title: 'Article 1',
        difficultyLevel: 'L1',
        createdAt: Date.now(),
        targetWords: ['word1'],
        source: 'generated'
    },
    {
        id: 2,
        uuid: 'uuid-2',
        title: 'Article 2',
        difficultyLevel: 'L2',
        createdAt: Date.now(),
        targetWords: ['word2'],
        source: 'generated'
    }
]

describe('LibraryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default mocks
        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([])
        mockGetPage.mockResolvedValue([])
    })

    it('renders initial list and loads more on button click', async () => {
        // Setup Mocks
        const initialArticles = [
            { id: 1, uuid: 'u1', title: 'Article 1', createdAt: 100 },
            { id: 2, uuid: 'u2', title: 'Article 2', createdAt: 90 }
        ]
        const nextArticles = [
            { id: 3, uuid: 'u3', title: 'Article 3', createdAt: 80 }
        ]

        // Mock getPage to return chunks
        mockGetPage
            .mockResolvedValueOnce(initialArticles as any) // Valid for initial load
            .mockResolvedValueOnce(nextArticles as any)    // Valid for second page
            .mockResolvedValueOnce([])                     // Empty for third page (no more data)

        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([])

        render(
            <MemoryRouter>
                <LibraryPage />
            </MemoryRouter>
        )

        // Verify initial load (Page 1)
        await waitFor(() => {
            expect(screen.getByText('Article 1')).toBeInTheDocument()
            expect(screen.getByText('Article 2')).toBeInTheDocument()
            expect(screen.queryByText('Article 3')).not.toBeInTheDocument()
        })

        // Find and click "Load More"
        const loadMoreBtn = screen.getByText('加载更多...')
        fireEvent.click(loadMoreBtn)

        // Verify appended load (Page 2)
        await waitFor(() => {
            expect(screen.getByText('Article 1')).toBeInTheDocument()
            expect(screen.getByText('Article 2')).toBeInTheDocument()
            expect(screen.getByText('Article 3')).toBeInTheDocument()
        })
    })

    it('shows delete confirmation and deletes article', async () => {
        // Setup for delete test: needs initial data
        // Must mock getPage because LibraryPage calls it on mount
        mockGetPage.mockResolvedValue(mockArticles as any)
        mockDelete.mockResolvedValue(undefined)

        render(
            <MemoryRouter>
                <LibraryPage />
            </MemoryRouter>
        )

        // Wait for list
        await waitFor(() => {
            expect(screen.getByText('Article 1')).toBeInTheDocument()
        })

        // Click delete on Article 1
        const deleteButtons = screen.getAllByLabelText('delete')
        fireEvent.click(deleteButtons[0])

        // Dialog should appear
        expect(await screen.findByText('Are you sure you want to delete this article? This action cannot be undone.')).toBeInTheDocument()

        // Click Confirm (The button that says "Delete")
        // The title "Delete Article" is also present, so queryAllByText might return multiple.
        // We want the button.
        const confirmBtn = screen.getByRole('button', { name: 'Delete' })
        fireEvent.click(confirmBtn)

        await waitFor(() => {
            expect(mockDelete).toHaveBeenCalledWith(1)
            expect(screen.queryByText('Article 1')).not.toBeInTheDocument()
        })
    })


})
