import { useState, useEffect } from 'react'
import {
    Container,
    Typography,
    Stack,
    Box,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    Assessment as AssessmentIcon,
    History as HistoryIcon
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

import HistoryListCard from './HistoryListCard'

export default function QuizHistoryPage() {
    const { t } = useTranslation(['history', 'common', 'library'])
    const navigate = useNavigate()
    const location = useLocation()
    const [enhancedRecords, setEnhancedRecords] = useState<EnhancedQuizRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        // Check for error passed from other pages (e.g. ReadingPage failed loading)
        const state = location.state as { error?: string }
        if (state?.error) {
            setErrorMsg(state.error)
            // Clear state so error doesn't persist on refresh
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

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
                    // Assuming articleId is consistent. If using article UUID, ensure mapping is correct.
                    // The mock/db types suggest articleId refers to Article's id or uuid?
                    // Let's assume articleId matches the key used in map.

                    if (record.articleId) {
                        attemptCounts[record.articleId] = (attemptCounts[record.articleId] || 0) + 1
                    }

                    return {
                        ...record,
                        articleTitle: article?.title || t('common:unknownArticle'),
                        articleDifficulty: article?.difficultyLevel || 'N/A',
                        attemptNumber: attemptCounts[record.articleId] || 1
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
                    {t('history:subtitle', { count: enhancedRecords.length })}
                </Typography>
            </Box>

            {enhancedRecords.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center', borderRadius: 2, border: '2px dashed', borderColor: 'divider' }}>
                    <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {t('history:noRecords')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('history:startPrompt')}
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={0}>
                    {enhancedRecords.map((record) => (
                        <HistoryListCard
                            key={record.id}
                            record={record}
                            onReview={() => navigate(`/history/${record.id}`)}
                        />
                    ))}
                </Stack>
            )}

            <Snackbar
                open={!!errorMsg}
                autoHideDuration={6000}
                onClose={() => setErrorMsg(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setErrorMsg(null)} severity="error" sx={{ width: '100%' }}>
                    {errorMsg}
                </Alert>
            </Snackbar>
        </Container>
    )
}
