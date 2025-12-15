
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LibraryPage from './LibraryPage'
import { quizRecordService } from '../services/quizRecordService'
import { MemoryRouter } from 'react-router-dom'
import { PageError, PageLoading } from '../components/common'

// Mock Components
vi.mock('../components/common/PageLoading', () => ({
    default: () => <div data-testid="page-loading">Loading...</div>
}))

vi.mock('../components/common/PageError', () => ({
    default: ({ error, resetErrorBoundary }: any) => (
        <div data-testid="page-error">
            {error.message}
            <button onClick={resetErrorBoundary}>Retry</button>
        </div>
    )
}))

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
            if (key === 'library:empty.title') return '暂无文章'
            if (key === 'library:empty.description') return 'Get started by generating or importing an article.'
            if (key === 'library:empty.action') return 'Create Article'
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

describe('LibraryPage Validation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetPage.mockReset()
        mockDelete.mockReset()
        mockGetAll.mockReset()

        // Default mocks
        vi.mocked(quizRecordService.getRecordsByArticleUuid).mockResolvedValue([])
    })

    it('shows loading state initially', () => {
        mockGetPage.mockReturnValue(new Promise(() => { })) // Never resolves
        render(
            <MemoryRouter>
                <LibraryPage />
            </MemoryRouter>
        )
        expect(screen.getByTestId('page-loading')).toBeInTheDocument()
    })

    it('shows error state when fetch fails', async () => {
        const errorMessage = 'Network Error'
        mockGetPage.mockRejectedValue(new Error(errorMessage))

        render(
            <MemoryRouter>
                <LibraryPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByTestId('page-error')).toBeInTheDocument()
            expect(screen.getByText(errorMessage)).toBeInTheDocument()
        })
    })

    it('retries loading when retry clicked in error state', async () => {
        const errorMessage = 'Network Error'
        mockGetPage.mockRejectedValueOnce(new Error(errorMessage))
        mockGetPage.mockResolvedValueOnce([])

        render(
            <MemoryRouter>
                <LibraryPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByTestId('page-error')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Retry'))

        // Should go back to loading or loaded
        await waitFor(() => {
            expect(screen.queryByTestId('page-error')).not.toBeInTheDocument()
            expect(mockGetPage).toHaveBeenCalledTimes(2)
        })
    })

    it('shows unified empty state when no articles found', async () => {
        mockGetPage.mockResolvedValue([])

        render(
            <MemoryRouter>
                <LibraryPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('暂无文章')).toBeInTheDocument()
            expect(screen.getByText('Get started by generating or importing an article.')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Create Article' })).toBeInTheDocument()
        })
    })
})
