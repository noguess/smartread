import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Container,
    Box,
    Typography,
    List,
    ListItem,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Paper,
    Stack,
    Divider
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import QuizIcon from '@mui/icons-material/Quiz'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { articleService } from '../services/articleService'
import { quizRecordService } from '../services/quizRecordService'
import { Article } from '../services/db'
import { useTranslation } from 'react-i18next'

interface ArticleWithStats extends Article {
    quizCount: number
    highestScore: number
}

export default function LibraryPage() {
    const { t } = useTranslation(['library', 'common'])
    const navigate = useNavigate()
    const [articles, setArticles] = useState<ArticleWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [articleToDelete, setArticleToDelete] = useState<ArticleWithStats | null>(null)

    useEffect(() => {
        loadArticles()
    }, [])

    const loadArticles = async () => {
        try {
            setLoading(true)
            const data = await articleService.getAll()

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
                        highestScore
                    }
                })
            )

            setArticles(articlesWithStats)
        } catch (error) {
            console.error('Failed to load articles:', error)
        } finally {
            setLoading(false)
        }
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
                <Paper elevation={1}>
                    <List sx={{ p: 0 }}>
                        {articles.map((article, index) => (
                            <Box key={article.id}>
                                <ListItem
                                    sx={{
                                        py: 3,
                                        px: 3,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 2,
                                        '&:hover': {
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                >
                                    {/* Icon */}
                                    <AutoStoriesIcon
                                        sx={{
                                            fontSize: 40,
                                            color: 'primary.main',
                                            mt: 0.5
                                        }}
                                    />

                                    {/* Main Content */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        {/* Title */}
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                mb: 0.5
                                            }}
                                        >
                                            {article.title}
                                        </Typography>

                                        {/* Difficulty and Date with target words */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            <Chip
                                                label={article.difficultyLevel}
                                                size="small"
                                                color={getDifficultyColor(article.difficultyLevel)}
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                •
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(article.createdAt)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                •
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {article.targetWords.slice(0, 3).map((word, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={word}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                ))}
                                                {article.targetWords.length > 3 && (
                                                    <Chip
                                                        label={`+${article.targetWords.length - 3}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Quiz statistics */}
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <QuizIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {article.quizCount} {article.quizCount === 1 ? t('library:card.quiz', 'quiz') : t('library:card.quizzes', 'quizzes')}
                                                </Typography>
                                            </Box>
                                            {article.quizCount > 0 && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <EmojiEventsIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('library:card.best', 'Best:')} <strong>{article.highestScore}%</strong>
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Actions - vertically centered */}
                                    <Stack direction="row" spacing={1} sx={{ alignSelf: 'center' }}>
                                        <Button
                                            variant="contained"
                                            size="small"
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
                                    </Stack>
                                </ListItem>
                                {index < articles.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                </Paper>
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
