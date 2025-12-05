import { Box, Typography, Button, Grid, Paper, CircularProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { AutoAwesome, Tune, VolumeUp, LocalFireDepartment, AccessTime } from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import { Word } from '../../services/db'

const StyledCard = styled(Paper)(({ theme }) => ({
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
    },
}))

const GradientButton = styled(Button)({
    background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
    '&:hover': {
        background: 'linear-gradient(135deg, #3A7BC8 0%, #6B58CE 100%)',
    },
})

interface DashboardHeroProps {
    onSmartGenerate: () => void
    onManualMode: () => void
    consecutiveDays: number
    totalMinutes: number
    lastLearningDate: string
    recommendedWord?: Word | null
}

export default function DashboardHero({
    onSmartGenerate,
    onManualMode,
    consecutiveDays,
    totalMinutes,
    recommendedWord,
}: DashboardHeroProps) {
    const { t } = useTranslation(['home'])
    const playPronunciation = () => {
        if (recommendedWord?.phonetic) {
            const utterance = new SpeechSynthesisUtterance(recommendedWord.spelling)
            utterance.lang = 'en-US'
            utterance.rate = 0.8
            window.speechSynthesis.speak(utterance)
        }
    }

    // Calculate progress percentages (example: max 7 days, 60 minutes)
    const daysProgress = Math.min((consecutiveDays / 7) * 100, 100)
    const minutesProgress = Math.min((totalMinutes / 60) * 100, 100)

    return (
        <StyledCard
            elevation={0}
            sx={{
                p: 4,
                bgcolor: 'white',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                {/* Left: Content Column */}
                <Grid item xs={12} md={8}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        minHeight: 240 // Ensure enough height for spacing
                    }}>
                        {/* 1. Top: Title */}
                        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {t('home:hero.greeting')}
                            <span style={{ fontSize: '2rem' }}>🚀</span>
                        </Typography>

                        {/* 2. Middle: Stats (Centered Vertically) */}
                        <Box sx={{
                            flex: 1, // Take up remaining space
                            display: 'flex',
                            alignItems: 'center', // Vertically center content
                            py: 2 // Reduced padding
                        }}>
                            <Box sx={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                {/* Consecutive Days */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <LocalFireDepartment sx={{ fontSize: 48, color: '#FF6B6B' }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1 }}>
                                            {consecutiveDays}{t('home:hero.days')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                                            {t('home:hero.streak')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ position: 'relative', display: 'inline-flex', ml: 2 }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={100}
                                            size={56}
                                            thickness={3}
                                            sx={{ color: '#E8E8E8' }}
                                        />
                                        <CircularProgress
                                            variant="determinate"
                                            value={daysProgress}
                                            size={56}
                                            thickness={3}
                                            sx={{
                                                color: '#4A90E2',
                                                position: 'absolute',
                                                left: 0,
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* Divider */}
                                <Box sx={{ width: '1px', height: 50, bgcolor: '#E0E0E0' }} />

                                {/* Today's Minutes */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <AccessTime sx={{ fontSize: 48, color: '#4A90E2' }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1 }}>
                                            {totalMinutes}{t('home:hero.min')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                                            {t('home:hero.todayAccumulation')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ position: 'relative', display: 'inline-flex', ml: 2 }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={100}
                                            size={56}
                                            thickness={3}
                                            sx={{ color: '#E8E8E8' }}
                                        />
                                        <CircularProgress
                                            variant="determinate"
                                            value={minutesProgress}
                                            size={56}
                                            thickness={3}
                                            sx={{
                                                color: '#4A90E2',
                                                position: 'absolute',
                                                left: 0,
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* 3. Bottom: Buttons */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <GradientButton
                                variant="contained"
                                size="large"
                                startIcon={<AutoAwesome />}
                                onClick={onSmartGenerate}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.05rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'none',
                                }}
                            >
                                {t('home:hero.smartGenerate')}
                            </GradientButton>

                            <Button
                                variant="text"
                                startIcon={<Tune />}
                                onClick={onManualMode}
                                sx={{
                                    px: 3,
                                    py: 1.5,
                                    fontSize: '1.05rem',
                                    color: 'text.secondary',
                                    textTransform: 'none',
                                }}
                            >
                                {t('home:hero.customMode')}
                            </Button>
                        </Box>
                    </Box>
                </Grid>

                {/* Right: Daily Word Card */}
                <Grid item xs={12} md={4}>
                    {recommendedWord && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                height: '100%',
                                background: 'linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)',
                                color: 'white',
                                borderRadius: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Typography variant="body2" sx={{ opacity: 0.9, alignSelf: 'flex-start' }}>
                                {t('home:hero.dailyWord')}
                            </Typography>

                            <Box sx={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 1 }}>
                                    <Typography variant="h3" fontWeight="bold">
                                        {recommendedWord.spelling}
                                    </Typography>
                                    <VolumeUp
                                        sx={{
                                            cursor: 'pointer',
                                            fontSize: 28,
                                            '&:hover': { opacity: 0.8 },
                                        }}
                                        onClick={playPronunciation}
                                    />
                                </Box>

                                <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                                    {recommendedWord.phonetic || '/word/'}
                                </Typography>

                                <Typography variant="h6">
                                    v.{recommendedWord.meaning}
                                </Typography>
                            </Box>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </StyledCard>
    )
}
