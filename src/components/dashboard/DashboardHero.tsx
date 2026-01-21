import { Box, Typography, Button, Grid, Paper } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { AutoAwesome, Tune, VolumeUp, LocalFireDepartment, AccessTime, School } from '@mui/icons-material'

import { styled } from '@mui/material/styles'
import { Word } from '../../services/db'

const StyledCard = styled(Paper)(() => ({
    transition: 'all 0.3s ease-in-out',
    // Removed hover lift effect for the main container to keep it stable layout-wise
    // '&:hover': {
    //     transform: 'translateY(-4px)',
    //     boxShadow: theme.shadows[8],
    // },
}))

const GradientButton = styled(Button)({
    background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)',
    '&:hover': {
        background: 'linear-gradient(135deg, #3A7BC8 0%, #6B58CE 100%)',
        boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)',
    },
})

const StatBox = ({ icon: Icon, value, label, color }: any) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
            p: 1.5,
            borderRadius: '16px',
            bgcolor: `${color}15`, // 15% opacity
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Icon sx={{ fontSize: 32 }} />
        </Box>
        <Box>
            <Typography variant="h5" fontWeight="800" sx={{ lineHeight: 1.1 }}>
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="500">
                {label}
            </Typography>
        </Box>
    </Box>
)

interface DashboardHeroProps {
    onSmartGenerate: () => void
    onManualMode: () => void
    consecutiveDays: number
    totalMinutes: number
    lastLearningDate: string
    recommendedWord?: Word | null
    onOpenDetail: (word: string) => void
    onStartDrill: () => void
}


export default function DashboardHero({
    onSmartGenerate,
    onManualMode,
    consecutiveDays,
    totalMinutes,
    lastLearningDate,
    recommendedWord,
    onOpenDetail,
    onStartDrill,
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

    // Unused progress calculations removed

    return (
        <StyledCard
            elevation={0}
            sx={{
                p: 4,
                bgcolor: 'white',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            }}
        >
            <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                {/* Left: Content Column */}
                <Grid item xs={12} lg={8}>
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

                        {/* 2. Middle: Stats (Clean & Modern) */}
                        <Box sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            py: 4
                        }}>
                            <Grid container spacing={4}>
                                <Grid item xs={12} sm={6}>
                                    <StatBox
                                        icon={LocalFireDepartment}
                                        // Restore logic: Show streak if >0, else show Last Study Date or default text
                                        value={consecutiveDays > 0
                                            ? `${consecutiveDays} ${t('home:hero.days')}`
                                            : (lastLearningDate || '--')}
                                        label={consecutiveDays > 0
                                            ? t('home:hero.streak')
                                            : (lastLearningDate ? t('home:hero.lastStudy') : t('home:hero.keepGoing'))}
                                        color="#FF6B6B"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <StatBox
                                        icon={AccessTime}
                                        value={`${totalMinutes} ${t('home:hero.min')}`}
                                        label={t('home:hero.todayAccumulation')}
                                        color="#4A90E2"
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* 3. Bottom: Buttons */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <GradientButton
                                variant="contained"
                                size="large"
                                startIcon={<AutoAwesome />}
                                onClick={onSmartGenerate}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'none',
                                    minWidth: 200
                                }}
                            >
                                {t('home:hero.smartGenerate')}
                            </GradientButton>

                            <Button
                                variant="outlined"
                                startIcon={<Tune />}
                                onClick={onManualMode}
                                sx={{
                                    px: 3,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    borderRadius: '12px',
                                    borderColor: 'divider',
                                    color: 'text.secondary',
                                    textTransform: 'none',
                                    borderWidth: '2px', // Thicker border
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'primary.50',
                                        borderWidth: '2px',
                                    }
                                }}
                            >
                                {t('home:hero.customMode')}
                            </Button>

                            <GradientButton
                                variant="contained"
                                size="large"
                                startIcon={<School />}
                                onClick={onStartDrill}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'none',
                                    minWidth: 200,
                                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', // Distinct orange/red for drill
                                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #EE5B5B 0%, #EF7E43 100%)',
                                    }
                                }}
                            >
                                {t('home:hero.startDrill')}
                            </GradientButton>

                        </Box>
                    </Box>
                </Grid>

                {/* Right: Daily Word Card */}
                <Grid item xs={12} lg={4}>
                    {recommendedWord && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                height: '100%',
                                background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
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
                                    {recommendedWord.meaning}
                                </Typography>


                                <Typography
                                    variant="caption"
                                    sx={{
                                        mt: 1,
                                        opacity: 0.8,
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        '&:hover': { opacity: 1 }
                                    }}
                                    onClick={() => onOpenDetail(recommendedWord.spelling)}
                                >
                                    {t('home:hero.deepLearning')}
                                </Typography>
                            </Box>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </StyledCard>
    )
}
