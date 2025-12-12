import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Container,
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Stack
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
// Keep SearchIcon for future search impl or header visual if needed, 
// though reader.html header is 'sticky top' global header usually. 
// We will focus on the in-page header.

import { articleService } from '../services/articleService'
import { quizRecordService } from '../services/quizRecordService'
import { useTranslation } from 'react-i18next'
import ArticleListCard, { ArticleCardProps } from '../components/reading/ArticleListCard'

// Reusing the type from ArticleListCard or creating a shared one
// For now, assume it matches.
// We need to ensure we pass the right shape.
type ArticleWithStats = ArticleCardProps['article']

export default function LibraryPage() {
    const { t } = useTranslation(['library', 'common'])
    const navigate = useNavigate()
    const [articles, setArticles] = useState<ArticleWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [articleToDelete, setArticleToDelete] = useState<ArticleWithStats | null>(null)

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
                        ? Math.max(...quizRecords.map(r => r.score))
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

    const handleDeleteClick = (article: ArticleWithStats) => {
        setArticleToDelete(article)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (articleToDelete && articleToDelete.id) {
            try {
                await articleService.delete(articleToDelete.id)
                setArticles(articles.filter(a => a.id !== articleToDelete.id))
                setDeleteDialogOpen(false)
                setArticleToDelete(null)
            } catch (error) {
                console.error('Failed to delete article:', error)
            }
        }
    }
    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        )
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
                            onDelete={handleDeleteClick}
                        />
                    ))
                ) : (
                    <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="body1">
                            {t('library:empty.title', '暂无文章')}
                        </Typography>
                    </Box>
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

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>{t('library:delete.title', 'Delete Article')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('library:delete.message', 'Are you sure you want to delete this article? This action cannot be undone.')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        {t('common:button.cancel', 'Cancel')}
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        {t('common:button.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}
