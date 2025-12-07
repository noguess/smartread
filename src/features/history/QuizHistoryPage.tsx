import { useState, useEffect } from 'react'
import {
    Container,
    Typography,
    Paper,
    Stack,
    Box,
    CircularProgress,
    Chip,
    List,
    ListItem,
    Divider,
    Button
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
    Assessment as AssessmentIcon,
    Speed,
    History as HistoryIcon,
    EmojiEvents
} from '@mui/icons-material'
import { quizRecordService } from '../../services/quizRecordService'
import { articleService } from '../../services/articleService'
import { QuizRecord, Article } from '../../services/db'

// Enhanced Type to include derived data
interface EnhancedQuizRecord extends QuizRecord {
    articleTitle: string
    articleDifficulty: string
    attemptNumber: number
}

// Utility to format duration
const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function QuizHistoryPage() {
    const { t } = useTranslation(['history', 'common', 'library'])
    const navigate = useNavigate()
    const [enhancedRecords, setEnhancedRecords] = useState<EnhancedQuizRecord[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [records, articles] = await Promise.all([
                    quizRecordService.getAll(),
                    articleService.getAll()
                ])

                const articleMap = new Map<string, Article>(articles.map(a => [a.uuid, a]))

                // Group records by articleId to calculate attempt numbers
                // First, sort all records by date ascending to count attempts correctly
                const sortedAsc = [...records].sort((a, b) => a.date - b.date)

                const attemptCounts: Record<string, number> = {}
                const processed = sortedAsc.map(record => {
                    const article = articleMap.get(record.articleId)

                    // Increment attempt count for this article
                    attemptCounts[record.articleId] = (attemptCounts[record.articleId] || 0) + 1

                    return {
                        ...record,
                        articleTitle: article?.title || t('common:unknownArticle'),
                        articleDifficulty: article?.difficultyLevel || 'N/A',
                        attemptNumber: attemptCounts[record.articleId]
                    }
                })

                // Finally, reverse to show newest first
                setEnhancedRecords(processed.reverse())
            } catch (error) {
                console.error('Failed to load history:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [t])

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'L1': return 'success'
            case 'L2': return 'primary'
            case 'L3': return 'error'
            default: return 'default'
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'success.main'
        if (score >= 60) return 'warning.main'
        return 'error.main'
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AssessmentIcon fontSize="large" color="primary" />
                    {t('history:title', 'Learning History')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('history:subtitle', `${enhancedRecords.length} records found`)}
                </Typography>
            </Box>

            {enhancedRecords.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center', borderRadius: 2, border: '2px dashed', borderColor: 'divider' }}>
                    <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {t('history:noRecords', 'No learning records yet')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('history:startPrompt', 'Go read some articles and take quizzes!')}
                    </Typography>
                </Box>
            ) : (
                <Paper elevation={1}>
                    <List sx={{ p: 0 }}>
                        {enhancedRecords.map((record, index) => (
                            <Box key={record.id}>
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
                                    <AssessmentIcon
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
                                                mb: 0.5
                                            }}
                                        >
                                            {record.articleTitle}
                                        </Typography>

                                        {/* Metadata Row: Difficulty • Date • Duration */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={record.articleDifficulty}
                                                size="small"
                                                color={getDifficultyColor(record.articleDifficulty)}
                                            />
                                            <Typography variant="body2" color="text.secondary">•</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {format(new Date(record.date), 'yyyy-MM-dd HH:mm')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">•</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Speed sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDuration(record.timeSpent)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Stats Row: Score & Attempts */}
                                        <Box sx={{ display: 'flex', gap: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <EmojiEvents sx={{ fontSize: 18, color: 'warning.main' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('common:score', 'Score')}:
                                                    <Box component="span" sx={{ fontWeight: 900, color: getScoreColor(record.score), ml: 0.5 }}>
                                                        {record.score}
                                                    </Box>
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('history:attempt', 'Take #{{count}}', { count: record.attemptNumber })}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Action Button */}
                                    <Stack direction="row" spacing={1} sx={{ alignSelf: 'center' }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => navigate(`/history/${record.id}`)}
                                        >
                                            {t('history:review', 'Review')}
                                        </Button>
                                    </Stack>
                                </ListItem>
                                {index < enhancedRecords.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                </Paper>
            )}
        </Container>
    )
}
