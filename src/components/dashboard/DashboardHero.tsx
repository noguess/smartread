import { Paper, Typography, Button, Box } from '@mui/material'
import { AutoAwesome, Tune } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { GradientButton } from '../common'

interface DashboardHeroProps {
    reviewCount: number
    newCount: number
    onSmartGenerate: () => void
    onManualMode: () => void
}

export default function DashboardHero({
    reviewCount,
    newCount,
    onSmartGenerate,
    onManualMode,
}: DashboardHeroProps) {
    const { t } = useTranslation(['home'])

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
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

            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Typography variant="h3" component="span" sx={{ fontSize: '2.5rem' }}>
                        🚀
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                        {t('home:hero.title')}
                    </Typography>
                </Box>

                <Typography variant="h6" sx={{ opacity: 0.95, mb: 3, fontWeight: 400 }}>
                    📝 {t('home:hero.todayPlan', { reviewCount, newCount })}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <GradientButton
                        size="large"
                        startIcon={<AutoAwesome />}
                        onClick={onSmartGenerate}
                        sx={{
                            bgcolor: 'white',
                            color: '#4A90E2',
                            background: 'white !important',
                            px: 4,
                            py: 1.5,
                            fontWeight: 'bold',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.95)',
                                background: 'rgba(255,255,255,0.95) !important',
                            },
                        }}
                    >
                        {t('home:hero.smartGenerate')}
                    </GradientButton>

                    <Button
                        variant="text"
                        startIcon={<Tune />}
                        onClick={onManualMode}
                        sx={{
                            color: 'white',
                            borderRadius: 3,
                            px: 2,
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.15)',
                            },
                        }}
                    >
                        {t('home:hero.customMode')}
                    </Button>
                </Box>
            </Box>
        </Paper>
    )
}
