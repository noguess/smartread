import React from 'react'
import {
    Box,
    Typography,
    Button,
    Chip,
    useTheme
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
import { BaseListCard } from '../../components/common'
import { LevelColors } from '../../theme/constants'
import { formatDate, formatDuration } from '../../utils/formatting'

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

const HistoryListCard: React.FC<HistoryCardProps> = ({ record, onReview }) => {
    const { t } = useTranslation(['history', 'common'])
    const theme = useTheme()

    const levelStyle = LevelColors[record.articleDifficulty] || { bg: theme.palette.grey[100], text: theme.palette.grey[700] }

    // Date formatting
    const dateStr = formatDate(record.date, undefined, {
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

    // Badge
    const badge = (
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
    )

    // Metadata
    const metadata = (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{dateStr}</Typography>
            </Box>

            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'grey.300', display: { xs: 'none', sm: 'block' } }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SpeedIcon sx={{ fontSize: 14 }} />
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{formatDuration(record.timeSpent)}</Typography>
            </Box>
        </>
    )

    // Stats
    const stats = (
        <>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: 'grey.50', px: 1, py: 0.5, borderRadius: 1
            }}>
                <TrophyIcon sx={{ fontSize: 14, color: getScoreColor(record.score || 0) }} />
                <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    {t('common:score')}:
                    <Box component="span" sx={{ fontWeight: 700, color: getScoreColor(record.score || 0), ml: 0.5 }}>
                        {record.score || 0}
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
        </>
    )

    // Actions
    const actions = (
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
    )

    return (
        <BaseListCard
            icon={<AssessmentIcon />}
            title={record.articleTitle}
            badge={badge}
            metadata={metadata}
            stats={stats}
            actions={actions}
            // Use subtle blue tint for history icon similar to original (alpha(theme.palette.primary.main, 0.1))
            iconBoxColor={{
                bg: theme.palette.primary.main, // BaseListCard will alpha(.5) this if we don't handle it carefully. 
                // Wait, BaseListCard uses alpha(bg, 0.5) by default logic if passed.
                // Original HistoryListCard used alpha(primary.main, 0.1).
                // If I pass primary.main, base will do alpha(primary.main, 0.5). That's too dark.
                // I should probably adjust BaseListCard to accept 'bg' as is, OR pass a color that results in correct alpha?
                // Or just pass the final color as string?
                // BaseListCard logic: `bgcolor: iconBoxColor ? alpha(iconBoxColor.bg, 0.5) : ...`
                // This is a flaw in my BaseListCard design if I want exact control.
                // For now, let's stick to the BaseListCard logic or update BaseListCard to handle 'transparent' or full color.
                // Actually, let's modify BaseListCard to use bg as is if it looks like an rgba/alpha string? 
                // No, simpler to just accept it. 0.5 alpha on primary might be okay for unification.
                // Let's stick with the design system unification (Task goal is unify styles).
                color: 'primary.main'
            }}
        />
    )
}

export default HistoryListCard
