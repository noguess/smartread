import React, { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    IconButton,
    Divider,
    Stack,
    LinearProgress,
    Paper
} from '@mui/material'
import {
    CheckCircle as CheckCircleIcon,
    Refresh as RefreshIcon,
    PlayArrow as PlayIcon,
    ArrowBack as BackIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { wordService } from '../../services/wordService'
import { Word } from '../../services/db'
import { GradientButton, PageLoading, EmptyState } from '../../components/common'
import { useTranslation } from 'react-i18next'

const DrillSelectionPage: React.FC = () => {
    const { t } = useTranslation('drill')
    const navigate = useNavigate()

    const [candidates, setCandidates] = useState<Word[]>([])
    const [selectedWords, setSelectedWords] = useState<Word[]>([])
    const [historyIds, setHistoryIds] = useState<number[]>([]) // Seen but not selected
    const [loading, setLoading] = useState(true)
    const [targetCount] = useState(20)

    const loadCandidates = useCallback(async (excludeIds: number[] = []) => {
        setLoading(true)
        try {
            const words = await wordService.getDailyCandidates(20, excludeIds)
            setCandidates(words)
        } catch (error) {
            console.error('Failed to load candidates', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadCandidates()
    }, [loadCandidates])

    const handleToggleSelect = (word: Word) => {
        const isSelected = selectedWords.some(sw => sw.id === word.id)
        if (isSelected) {
            setSelectedWords(prev => prev.filter(sw => sw.id !== word.id))
        } else {
            setSelectedWords(prev => [...prev, word])
        }
    }

    const handleRefresh = () => {
        // Current candidates that are NOT selected should be added to history (to avoid seeing them again)
        const currentIds = candidates.map(c => c.id!)
        const selectedIds = selectedWords.map(sw => sw.id!)
        const newHistory = [...new Set([...historyIds, ...currentIds])]
        setHistoryIds(newHistory)

        // Exclude both history and currently selected items
        const allExclude = [...new Set([...newHistory, ...selectedIds])]
        loadCandidates(allExclude)
    }

    const handleReset = () => {
        setSelectedWords([])
        setHistoryIds([])
        loadCandidates([])
    }

    const handleStart = () => {
        if (selectedWords.length === 0) return
        navigate('/drill/process', { state: { words: selectedWords } })
    }

    if (loading && candidates.length === 0) return <PageLoading />

    const progress = Math.min((selectedWords.length / targetCount) * 100, 100)

    if (candidates.length === 0 && selectedWords.length === 0) {
        return (
            <EmptyState
                title={t('selection.empty_title')}
                description={t('selection.empty_desc')}
                action={
                    <GradientButton onClick={() => navigate('/library')}>
                        {t('selection.go_reading')}
                    </GradientButton>
                }
            />
        )
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header Area */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton onClick={() => navigate('/')} sx={{ bgcolor: 'action.hover' }}>
                            <BackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h4" fontWeight="bold">
                                {t('selection.title')}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {t('selection.subtitle', { total: targetCount })}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <GradientButton
                            startIcon={<PlayIcon />}
                            size="large"
                            onClick={handleStart}
                            disabled={selectedWords.length === 0}
                        >
                            {t('selection.start_btn')}
                        </GradientButton>
                    </Stack>
                </Stack>

                <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" fontWeight="bold">
                                {t('selection.count_stat', { current: selectedWords.length, total: targetCount })}
                            </Typography>
                            {selectedWords.length > 0 && (
                                <Typography
                                    variant="caption"
                                    sx={{ cursor: 'pointer', color: 'primary.main' }}
                                    onClick={handleReset}
                                >
                                    {t('selection.reset_btn')}
                                </Typography>
                            )}
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ height: 12, borderRadius: 6, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 6 } }}
                        />
                    </Stack>
                </Paper>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Candidates Grid */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                    {t('selection.refresh_tooltip')}
                </Typography>
                <GradientButton
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    {t('selection.refresh_btn')}
                </GradientButton>
            </Box>

            <Grid container spacing={2}>
                {candidates.map((word) => {
                    const isSelected = selectedWords.some(sw => sw.id === word.id)
                    return (
                        <Grid item xs={12} sm={6} md={4} key={word.id}>
                            <Card
                                variant="outlined"
                                onClick={() => handleToggleSelect(word)}
                                sx={{
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    bgcolor: isSelected ? 'primary.50' : 'background.paper',
                                    borderWidth: isSelected ? 2 : 1,
                                    position: 'relative',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: isSelected ? '0 8px 24px rgba(74, 144, 226, 0.2)' : 3,
                                        borderColor: isSelected ? 'primary.main' : 'primary.light'
                                    }
                                }}
                            >
                                <CardContent sx={{ py: '20px !important' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: isSelected ? 'primary.main' : 'text.primary' }}>
                                                {word.spelling}
                                            </Typography>
                                            <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic', mb: 1 }}>
                                                {word.phonetic || '/.../'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
                                                {word.meaning}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mt: 0.5 }}>
                                            {isSelected ? (
                                                <CheckCircleIcon color="primary" fontSize="medium" />
                                            ) : (
                                                <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid', borderColor: 'divider' }} />
                                            )}
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    )
                })}
            </Grid>

            {candidates.length === 0 && selectedWords.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary" gutterBottom>
                        {t('selection.empty_title')}
                    </Typography>
                    <GradientButton onClick={handleReset} variant="outlined">
                        {t('selection.reset_btn')}
                    </GradientButton>
                </Box>
            )}
        </Container>
    )
}

export default DrillSelectionPage
