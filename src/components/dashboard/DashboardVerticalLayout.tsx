import { Box, Typography, Button, Stack, Paper, Grid, LinearProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { AutoAwesome, Tune, VolumeUp, LocalFireDepartment, AccessTime, TrendingUp, School } from '@mui/icons-material'

import { styled } from '@mui/material/styles'
import { Word, WordStatus } from '../../services/db'
import { GradientButton } from '../common'

// --- Styled Components ---

const SectionCard = styled(Paper)(({ theme }) => ({
    borderRadius: 24,
    padding: theme.spacing(3),
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'relative'
}))

const GradientWordCard = styled(Paper)(({ theme }) => ({
    borderRadius: 24,
    padding: theme.spacing(3),
    background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(74, 144, 226, 0.25)',
}))

const StatIconBox = styled(Box)<{ color: string }>(({ color }) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    color: color,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
}))

// --- Interfaces ---

interface DashboardVerticalLayoutProps {
    // Hero Actions
    onSmartGenerate: () => void
    onManualMode: () => void

    // Stats Data
    consecutiveDays: number
    totalMinutes: number
    lastLearningDate: string
    recommendedWord?: Word | null

    // Learning Stats
    totalWords: number
    masteredCount: number
    statusCounts: Record<WordStatus, number>
    onOpenDetail: (word: string) => void
    onStartDrill: () => void
}


// --- Component ---

export default function DashboardVerticalLayout({
    onSmartGenerate,
    onManualMode,
    consecutiveDays,
    totalMinutes,
    // lastLearningDate (unused in mobile layout)
    recommendedWord,
    totalWords,
    masteredCount,
    statusCounts,
    onOpenDetail,
    onStartDrill
}: DashboardVerticalLayoutProps) {

    const { t } = useTranslation(['home', 'common'])
    // Removed unused theme hook


    const playPronunciation = () => {
        if (recommendedWord?.phonetic) {
            const utterance = new SpeechSynthesisUtterance(recommendedWord.spelling)
            utterance.lang = 'en-US'
            utterance.rate = 0.8
            window.speechSynthesis.speak(utterance)
        }
    }

    const getPercent = (count: number) => (totalWords > 0 ? (count / totalWords) * 100 : 0)

    const statusIcons: Record<WordStatus, string> = {
        New: '🆕',
        Learning: '📚',
        Review: '🔄',
        Mastered: '✅',
    }

    return (
        <Stack spacing={2} sx={{ pb: 4 }}>

            {/* 1. Welcome & Quick Stats Section */}
            <SectionCard elevation={0}>
                {/* Greeting */}
                <Typography variant="h5" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {t('home:hero.greeting')} 🚀
                </Typography>

                {/* Quick Stats Row */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {/* Streak */}
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#FFF7ED', p: 2, borderRadius: 3, border: '1px solid #FFEDD5' }}>
                        <StatIconBox color="#F97316">
                            <LocalFireDepartment fontSize="small" />
                        </StatIconBox>
                        <Box>
                            <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1 }}>
                                {consecutiveDays > 0 ? consecutiveDays : '--'}
                            </Typography>
                            <Typography variant="caption" fontWeight="600" color="text.secondary">
                                {consecutiveDays > 0 ? t('home:hero.streak') : t('home:hero.keepGoing')}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Time */}
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#EFF6FF', p: 2, borderRadius: 3, border: '1px solid #DBEAFE' }}>
                        <StatIconBox color="#3B82F6">
                            <AccessTime fontSize="small" />
                        </StatIconBox>
                        <Box>
                            <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1 }}>
                                {totalMinutes} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{t('home:hero.min')}</span>
                            </Typography>
                            <Typography variant="caption" fontWeight="600" color="text.secondary">
                                {t('home:hero.todayAccumulation')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <GradientButton
                        startIcon={<AutoAwesome />}
                        onClick={onSmartGenerate}
                        fullWidth
                        sx={{ py: 1.5, borderRadius: 3 }}
                    >
                        {t('home:hero.smartGenerate')}
                    </GradientButton>

                    <Button
                        variant="outlined"
                        startIcon={<Tune />}
                        onClick={onManualMode}
                        fullWidth
                        sx={{
                            py: 1.5,
                            borderRadius: 3,
                            borderWidth: 2,
                            fontWeight: 'bold',
                            color: 'text.secondary',
                            borderColor: 'divider',
                            '&:hover': {
                                borderWidth: 2,
                                bgcolor: 'action.hover',
                                borderColor: 'primary.main'
                            }
                        }}
                    >
                        {t('home:hero.customMode')}
                    </Button>
                </Box>

                <GradientButton
                    startIcon={<School />}
                    onClick={onStartDrill}
                    fullWidth
                    sx={{
                        mt: 2,
                        py: 1.5,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                        boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                    }}
                >
                    {t('home:hero.startDrill')}
                </GradientButton>

            </SectionCard>

            {/* 2. Daily Word Card */}
            {recommendedWord && (
                <GradientWordCard elevation={0}>
                    {/* Decorative Background */}
                    <Box sx={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />
                    <Box sx={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, bgcolor: 'rgba(123, 104, 238, 0.4)', borderRadius: '50%', filter: 'blur(20px)' }} />

                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                        {/* Left: Word Info */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.2, borderRadius: 1 }}>
                                    {t('home:hero.dailyLabel')}
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.8 }}>
                                    [{recommendedWord.phonetic || ''}]
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="800" sx={{ lineHeight: 1 }}>
                                {recommendedWord.spelling}
                            </Typography>
                        </Box>

                        {/* Right: Meaning & Audio */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" fontWeight="500" sx={{ opacity: 0.9 }}>
                                    {recommendedWord.meaning}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ opacity: 0.7, textDecoration: 'underline', cursor: 'pointer' }}
                                    onClick={() => onOpenDetail(recommendedWord.spelling)}
                                >
                                    {t('home:hero.deepLearning')}
                                </Typography>
                            </Box>
                            <Box
                                onClick={playPronunciation}
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.2s',
                                    '&:active': { transform: 'scale(0.95)' }
                                }}
                            >
                                <VolumeUp />
                            </Box>
                        </Box>

                    </Box>
                </GradientWordCard>
            )}

            {/* 3. Learning Stats Section */}
            <SectionCard elevation={0}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingUp color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        {t('home:stats.title')}
                    </Typography>
                </Box>

                {/* Progress Bar */}
                <Box sx={{ bgcolor: '#ECFDF5', p: 2, borderRadius: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AutoAwesome fontSize="inherit" /> {t('home:stats.masteryProgress')}
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ lineHeight: 1 }}>
                            {Math.round(getPercent(masteredCount))}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={getPercent(masteredCount)}
                        sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(16, 185, 129, 0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#10B981' } }}
                    />
                    <Typography variant="caption" color="success.main" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.8 }}>
                        {masteredCount} {t('home:stats.wordsMastered')}
                    </Typography>
                </Box>

                {/* Grid Stats */}
                <Grid container spacing={1.5}>
                    {[
                        { label: t('home:stats.reviewNeeded'), count: statusCounts.Review, color: '#EF4444', icon: statusIcons.Review, bg: '#FEF2F2' },
                        { label: t('home:stats.newWords'), count: statusCounts.New, color: '#3B82F6', icon: statusIcons.New, bg: '#EFF6FF' },
                        { label: t('home:stats.learning'), count: statusCounts.Learning, color: '#F59E0B', icon: statusIcons.Learning, bg: '#FFFBEB' },
                        { label: t('home:stats.total'), count: totalWords, color: '#64748B', icon: '📖', bg: '#F1F5F9' },
                    ].map((item, index) => (
                        <Grid item xs={6} key={index}>
                            <Box sx={{ p: 2, borderRadius: 3, bgcolor: item.bg, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Typography variant="caption" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: item.color }}>
                                    {item.icon} {item.label}
                                </Typography>
                                <Typography variant="h6" fontWeight="800" sx={{ mt: 1, color: item.color === '#64748B' ? 'text.primary' : item.color }}>
                                    {item.count}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </SectionCard>
        </Stack>
    )
}
