import { Typography, Box, Grid, LinearProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { WordStatus } from '../../services/db'
import { StyledCard } from '../common'

interface DashboardStatsProps {
    totalWords: number
    masteredCount: number
    statusCounts: Record<WordStatus, number>
}

const statusIcons: Record<WordStatus, string> = {
    New: '🆕',
    Learning: '📚',
    Review: '🔄',
    Mastered: '✅',
}

export default function DashboardStats({
    totalWords,
    masteredCount,
    statusCounts,
}: DashboardStatsProps) {
    const { t } = useTranslation(['home', 'common'])
    const getPercent = (count: number) => (totalWords > 0 ? (count / totalWords) * 100 : 0)

    return (
        <StyledCard sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📊</span> {t('home:stats.title')}
            </Typography>

            {/* Mastery Progress */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'success.lighter', borderRadius: 2, background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(52,211,153,0.08) 100%)' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ✨ {t('home:stats.masteryProgress')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={getPercent(masteredCount)}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                            }}
                        />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                        {masteredCount}
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {t('home:stats.masteryPercent', { percent: totalWords > 0 ? Math.round(getPercent(masteredCount)) : 0 })}
                </Typography>
            </Box>

            {/* Status Cards */}
            <Grid container spacing={1.5}>
                <Grid item xs={6}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'error.lighter',
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(248,113,113,0.1) 100%)',
                    }}>
                        <Typography variant="caption" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {statusIcons.Review} {t('home:stats.reviewNeeded')}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="error.main">
                            {statusCounts.Review}
                        </Typography>
                    </Box>
                </Grid>

                <Grid item xs={6}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(96,165,250,0.1) 100%)',
                    }}>
                        <Typography variant="caption" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {statusIcons.New} {t('home:stats.newWords')}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                            {statusCounts.New}
                        </Typography>
                    </Box>
                </Grid>

                <Grid item xs={6}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(251,191,36,0.1) 100%)',
                    }}>
                        <Typography variant="caption" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {statusIcons.Learning} {t('home:stats.learning')}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="warning.main">
                            {statusCounts.Learning}
                        </Typography>
                    </Box>
                </Grid>

                <Grid item xs={6}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                    }}>
                        <Typography variant="caption" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            📖 {t('home:stats.total')}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {totalWords}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </StyledCard>
    )
}
