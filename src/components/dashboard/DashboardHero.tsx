import { Paper, Typography, Button, Box, Stack, Grid, IconButton } from '@mui/material'
import { AutoAwesome, Tune, LocalFireDepartment, AccessTime, CalendarToday, VolumeUp } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { GradientButton } from '../common'
import { Word } from '../../services/db'

interface DashboardHeroProps {
    consecutiveDays: number
    totalMinutes: number
    lastLearningDate: string
    recommendedWord: Word | null
    onSmartGenerate: () => void
    onManualMode: () => void
}

export default function DashboardHero({
    consecutiveDays,
    totalMinutes,
    lastLearningDate,
    recommendedWord,
    onSmartGenerate,
    onManualMode,
}: DashboardHeroProps) {
    const { t } = useTranslation(['home'])

    const handlePlayAudio = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (recommendedWord) {
            const utterance = new SpeechSynthesisUtterance(recommendedWord.spelling)
            utterance.lang = 'en-US'
            window.speechSynthesis.speak(utterance)
        }
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
            }}
        >
            {/* Decorative background shapes */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                }}
            />

            <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Left Content */}
                    <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Typography variant="h4" component="span" sx={{ fontSize: '2.2rem' }}>
                                🚀
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {t('home:hero.title')}
                            </Typography>
                        </Box>

                        {/* Learning Stats Section */}
                        <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                            {consecutiveDays > 0 ? (
                                <>
                                    <Box>
                                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <LocalFireDepartment fontSize="small" /> {t('home:hero.consecutiveDays')}
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold">
                                            {consecutiveDays} <Typography component="span" variant="h6">{t('home:hero.days')}</Typography>
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTime fontSize="small" /> {t('home:hero.totalTime')}
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold">
                                            {totalMinutes} <Typography component="span" variant="h6">{t('home:hero.min')}</Typography>
                                        </Typography>
                                    </Box>
                                </>
                            ) : (
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CalendarToday fontSize="small" /> {t('home:hero.lastLearning')}
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                                        {lastLearningDate || t('home:hero.startToday')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                        {t('home:hero.encourage')}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <GradientButton
                                size="large"
                                startIcon={<AutoAwesome />}
                                onClick={onSmartGenerate}
                                sx={{
                                    bgcolor: 'white',
                                    color: '#4A90E2',
                                    background: 'white !important',
                                    px: 3,
                                    py: 1,
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.95)',
                                        background: 'rgba(255,255,255,0.95) !important',
                                        transform: 'translateY(-2px)',
                                    },
                                }}
                            >
                                {t('home:hero.smartGenerate')}
                            </GradientButton>

                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<Tune />}
                                onClick={onManualMode}
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    borderWidth: 1.5,
                                    borderRadius: 3,
                                    px: 2,
                                    py: 0.8,
                                    fontWeight: 600,
                                    '&:hover': {
                                        borderColor: 'white',
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                        borderWidth: 1.5,
                                    },
                                }}
                            >
                                {t('home:hero.customMode')}
                            </Button>
                        </Box>
                    </Grid>

                    {/* Right Content: Word of the Moment */}
                    <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
                        {recommendedWord && (
                            <Box
                                sx={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: 3,
                                    p: 2.5,
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                    textAlign: 'center',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        background: 'rgba(255, 255, 255, 0.2)',
                                    }
                                }}
                            >
                                <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                                    Word of the Moment
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="h4" fontWeight="bold">
                                        {recommendedWord.spelling}
                                    </Typography>
                                    <IconButton size="small" onClick={handlePlayAudio} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                                        <VolumeUp fontSize="small" />
                                    </IconButton>
                                </Box>
                                {recommendedWord.phonetic && (
                                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1.5, fontFamily: 'monospace' }}>
                                        /{recommendedWord.phonetic}/
                                    </Typography>
                                )}
                                <Typography variant="body1" sx={{ fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {recommendedWord.meaning}
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    )
}
