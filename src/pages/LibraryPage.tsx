import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Container,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import { articleService } from '../services/articleService'
import { Article } from '../services/db'
import { useTranslation } from 'react-i18next'

export default function LibraryPage() {
    const { t } = useTranslation(['library', 'common'])
    const navigate = useNavigate()
    const [articles, setArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)

    useEffect(() => {
        loadArticles()
    }, [])

    const loadArticles = async () => {
        try {
            setLoading(true)
            const data = await articleService.getAll()
            setArticles(data)
        } catch (error) {
            console.error('Failed to load articles:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRead = (article: Article) => {
        if (article.id) {
            navigate(`/read/${article.id}`)
        }
    }

    const handleDeleteClick = (article: Article) => {
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

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'L1': return 'success'
            case 'L2': return 'primary'
            case 'L3': return 'error'
            default: return 'default'
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
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    {t('library:title', 'My Library')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('library:subtitle', `${articles.length} articles saved`)}
                </Typography>
            </Box>

            {articles.length === 0 ? (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 2
                    }}
                >
                    <AutoStoriesIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {t('library:empty.title', 'No articles yet')}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        {t('library:empty.description', 'Generate your first article from the home page')}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/')}>
                        {t('library:empty.button', 'Go to Home')}
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {articles.map((article) => (
                        <Grid item xs={12} sm={6} md={4} key={article.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Chip
                                            label={article.difficultyLevel}
                                            size="small"
                                            color={getDifficultyColor(article.difficultyLevel)}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(article.createdAt)}
                                        </Typography>
                                    </Box>

                                    <Typography variant="h6" gutterBottom sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        minHeight: '3.6em'
                                    }}>
                                        {article.title}
                                    </Typography>

                                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {article.targetWords.slice(0, 5).map((word, idx) => (
                                            <Chip
                                                key={idx}
                                                label={word}
                                                size="small"
                                                variant="outlined"
                                            />
                                        ))}
                                        {article.targetWords.length > 5 && (
                                            <Chip
                                                label={`+${article.targetWords.length - 5}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => handleRead(article)}
                                    >
                                        {t('library:card.read', 'Read')}
                                    </Button>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteClick(article)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

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
