import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ArticleListCard, { ArticleCardProps } from './ArticleListCard'

// Mock Data
const mockArticle: ArticleCardProps['article'] = {
    id: 1,
    uuid: 'test-uuid-1',
    title: 'Test Article Title',
    content: 'Content...',
    difficultyLevel: 'L1',
    createdAt: new Date('2025-12-10').getTime(),
    source: 'generated',
    targetWords: ['apple', 'banana', 'cherry', 'date'],
    wordCtxMeanings: [],

    // Stats
    quizCount: 2,
    highestScore: 85
} as any // Cast to any to avoid full DB type strictness in test if not needed

describe('ArticleListCard', () => {
    it('renders article information correctly', () => {
        const onRead = vi.fn()
        const onDelete = vi.fn()

        render(
            <ArticleListCard
                article={mockArticle}
                onRead={onRead}
                onDelete={onDelete}
            />
        )

        // Check Title
        expect(screen.getByText('Test Article Title')).toBeInTheDocument()

        // Check Difficulty Tag (L1)
        expect(screen.getByText('L1')).toBeInTheDocument()

        // Check Tags (Should show first 3)
        expect(screen.getByText('apple')).toBeInTheDocument()
        expect(screen.getByText('banana')).toBeInTheDocument()
        expect(screen.getByText('cherry')).toBeInTheDocument()
        // Should show +1 for the 4th tag
        expect(screen.getByText('+1')).toBeInTheDocument()

        // Check Stats
        expect(screen.getByText('2 次测试')).toBeInTheDocument()
        expect(screen.getByText('最佳: 85')).toBeInTheDocument()
    })

    it('triggers actions when buttons clicked', () => {
        const onRead = vi.fn()
        const onDelete = vi.fn()

        render(
            <ArticleListCard
                article={mockArticle}
                onRead={onRead}
                onDelete={onDelete}
            />
        )

        // Click Read Button
        fireEvent.click(screen.getByText('开始阅读'))
        expect(onRead).toHaveBeenCalledWith(mockArticle)

        // Click Delete Button
        // Using getByTitle functionality or looking for icon button
        // Since we may use Aria-label or Title
        const deleteBtn = screen.getByLabelText('delete')
        fireEvent.click(deleteBtn)
        expect(onDelete).toHaveBeenCalledWith(mockArticle)
    })

    it('handles missing stats gracefully', () => {
        const articleNoStats = {
            ...mockArticle,
            quizCount: 0,
            highestScore: 0
        }

        render(
            <ArticleListCard
                article={articleNoStats}
                onRead={() => { }}
                onDelete={() => { }}
            />
        )

        expect(screen.getByText('0 次测试')).toBeInTheDocument()
        // Best score shouldn't be rendered if 0/null or handled differently? 
        // Based on reader.html logic: `article.bestScore !== null`
        // We will assume it's hidden or shows 0. Let's assume hidden for "Best: 0" isn't very motivating, 
        // OR reader.html shows specific condition.
        // Reading LibraryPage logic: defaulting to 0.
        // Let's implement showing it if it exists, or maybe hiding if 0 quizzes.
        // In reader.html: `{article.bestScore !== null && (...)}`.
        // We will assert it is NOT present if we follow reader.html logic closely, OR effectively hidden.
        // Actually, if quizCount is 0, bestScore is likely irrelevant.
    })
})
