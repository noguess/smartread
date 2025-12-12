import React from 'react'
import {
    Box,
    Paper,
    Typography,
    Button,
    Chip,
    Stack,
    useTheme,
    alpha
} from '@mui/material'
import {
    Assessment as AssessmentIcon,
    History as HistoryIcon,
    EmojiEvents as TrophyIcon,
    Speed as SpeedIcon,
    ChevronRight as ChevronRightIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { QuizRecord } from '../../services/db'

// Enhanced Type from QuizHistoryPage
export interface EnhancedQuizRecord extends QuizRecord {
    articleTitle: string
    articleDifficulty: string
    attemptNumber: number
}

// Props definition
export interface HistoryCardProps {
    record: EnhancedQuizRecord
    onReview: (record: EnhancedQuizRecord) => void
}

const LevelColors: Record<string, { bg: string, text: string }> = {
    'L1': { bg: '#ECFDF5', text: '#047857' }, // Emerald
    'L2': { bg: '#EFF6FF', text: '#1D4ED8' }, // Blue
    'L3': { bg: '#FFF1F2', text: '#BE123C' }, // Rose
}

const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const HistoryListCard: React.FC<HistoryCardProps> = ({ record, onReview }) => {
    const { t } = useTranslation(['history', 'common'])
    const theme = useTheme()

    const levelStyle = LevelColors[record.articleDifficulty] || { bg: theme.palette.grey[100], text: theme.palette.grey[700] }

    // Date formatting
    const dateStr = new Date(record.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'success.main'
        if (score >= 60) return 'warning.main'
        return 'error.main'
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.100',
                transition: 'all 0.3s',
                '&:hover': {
                    boxShadow: theme.shadows[2],
                    borderColor: 'primary.100',
                },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 3,
                overflow: 'hidden',
                position: 'relative',
                mb: 2 // Margin bottom for list spacing
            }}
        >
            {/* Left: Icon Box */}
            <Box sx={{ flexShrink: 0 }}>
                <Box
                    sx={{
                        width: { xs: 56, sm: 64 },
                        height: { xs: 56, sm: 64 },
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                    }}
                >
                    <AssessmentIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                </Box>
            </Box>

            {/* Middle: Content */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                {/* Header: Title + Level */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                                fontWeight: 700,
                                color: 'text.primary',
                                lineHeight: 1.2,
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {record.articleTitle}
                        </Typography>

                        <Chip
                            label={record.articleDifficulty}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                borderRadius: 10,
                                bgcolor: levelStyle.bg,
                                color: levelStyle.text,
                                border: 'none'
                            }}
                        />
                    </Box>
                </Box>

                {/* Metadata Row: Date & Duration */}
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{dateStr}</Typography>
                    </Box>

                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'grey.300', display: { xs: 'none', sm: 'block' } }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SpeedIcon sx={{ fontSize: 14 }} />
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{formatDuration(record.timeSpent)}</Typography>
                    </Box>
                </Stack>

                {/* Stats Row: Score & Attempts */}
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: 'grey.50', px: 1, py: 0.5, borderRadius: 1
                    }}>
                        <TrophyIcon sx={{ fontSize: 14, color: getScoreColor(record.score) }} />
                        <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            {t('common:score')}:
                            <Box component="span" sx={{ fontWeight: 700, color: getScoreColor(record.score), ml: 0.5 }}>
                                {record.score}
                            </Box>
                        </Typography>
                    </Box>

                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: 'grey.50', px: 1, py: 0.5, borderRadius: 1
                    }}>
                        <HistoryIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            {t('history:attempt', { count: record.attemptNumber })}
                        </Typography>
                    </Box>
                </Stack>

            </Box>

            {/* Right: Actions */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'row', sm: 'column' },
                    alignItems: { xs: 'center', sm: 'flex-end' },
                    justifyContent: { xs: 'space-between', sm: 'center' },
                    gap: 1.5,
                    borderTop: { xs: '1px solid', sm: 'none' },
                    borderColor: 'grey.100',
                    pt: { xs: 2, sm: 0 }
                }}
            >
                <Button
                    variant="contained"
                    color="primary"
                    disableElevation
                    endIcon={<ChevronRightIcon />}
                    onClick={() => onReview(record)}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        flex: { xs: 1, sm: 'none' }
                    }}
                >
                    {t('history:review', '复习')}
                </Button>
            </Box>

        </Paper>
    )
}

export default HistoryListCard
