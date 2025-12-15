import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
    Stack
} from '@mui/material'
// Keep SearchIcon for future search impl or header visual if needed, 
// though reader.html header is 'sticky top' global header usually. 
// We will focus on the in-page header.

import { articleService } from '../services/articleService'
import { quizRecordService } from '../services/quizRecordService'
import { useTranslation } from 'react-i18next'
import ArticleListCard, { ArticleCardProps } from '../components/reading/ArticleListCard'
import { PageError, PageLoading, EmptyState } from '../components/common'

// Reusing the type from ArticleListCard or creating a shared one
// For now, assume it matches.
// We need to ensure we pass the right shape.
type ArticleWithStats = ArticleCardProps['article']

export default function LibraryPage() {
    const { t } = useTranslation(['library', 'common'])
    const navigate = useNavigate()
    const [articles, setArticles] = useState<ArticleWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Pagination State
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const PAGE_SIZE = 10

    useEffect(() => {
        loadArticles(1)
    }, [])

    const loadArticles = async (pageNum: number) => {
        try {
            setLoading(true)
            setError(null)
            const data = await articleService.getPage(pageNum, PAGE_SIZE)

            if (data.length < PAGE_SIZE) {
                setHasMore(false)
            } else {
                setHasMore(true) // Should remain true if full page returned, unless we want to lookahead. 
                // Simple logic: if < limit, no more. If == limit, assume more.
            }

            // Load quiz statistics for each article
            const articlesWithStats = await Promise.all(
                data.map(async (article) => {
                    const quizRecords = await quizRecordService.getRecordsByArticleUuid(article.uuid)
                    const quizCount = quizRecords.length
                    const highestScore = quizRecords.length > 0
                        ? Math.max(...quizRecords.map(r => r.score || 0))
                        : 0

                    return {
                        ...article,
                        quizCount,
                        highestScore: quizRecords.length > 0 ? highestScore : null
                    } as any as ArticleWithStats
                })
            )

            // Sort by date desc
            articlesWithStats.sort((a, b) => b.createdAt - a.createdAt)

            if (pageNum === 1) {
                setArticles(articlesWithStats)
            } else {
                setArticles(prev => [...prev, ...articlesWithStats])
            }
        } catch (error) {
            console.error('Failed to load articles:', error)
            setError(error instanceof Error ? error : new Error('Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        loadArticles(nextPage)
    }

    const handleRead = (article: ArticleWithStats) => {
        if (article.id) {
            navigate(`/read/${article.id}`)
        }
    }

    if (loading) {
        return <PageLoading message={t('common:common.loading')} />
    }

    if (error) {
        return <PageError error={error} resetErrorBoundary={() => loadArticles(page)} />
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>

            {/* Header Section */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 4
            }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                        {t('library:title', '我的阅读列表')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('library:subtitle', { count: articles.length })}
                    </Typography>
                </Box>
            </Box>

            {/* Article List */}
            <Stack spacing={2}>
                {articles.length > 0 ? (
                    articles.map((article) => (
                        <ArticleListCard
                            key={article.id}
                            article={article}
                            onRead={handleRead}
                        />
                    ))
                ) : (
                    <EmptyState
                        title={t('library:empty.title', '暂无文章')}
                        description={t('library:empty.description', '开始生成或导入您的第一篇文章吧！')}
                        action={
                            <Button variant="contained" onClick={() => navigate('/')}>
                                {t('library:empty.action', '去首页生成')}
                            </Button>
                        }
                    />
                )}
            </Stack>

            {/* Load More Button */}
            {hasMore && articles.length > 0 && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button
                        variant="text"
                        onClick={handleLoadMore}
                        disabled={loading}
                        sx={{ color: 'text.secondary' }}
                    >
                        {loading ? <CircularProgress size={24} /> : t('common:button.load_more', '加载更多...')}
                    </Button>
                </Box>
            )}

        </Container>
    )
}
