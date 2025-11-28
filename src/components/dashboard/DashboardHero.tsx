import { Paper, Typography, Button, Box } from '@mui/material'
import { AutoAwesome, Settings } from '@mui/icons-material'

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
    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                background: 'linear-gradient(135deg, #006064 0%, #0097A7 100%)',
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                    Start Learning
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
                    Today's Plan: {reviewCount} Review Words + {newCount} New Words
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<AutoAwesome />}
                        onClick={onSmartGenerate}
                        sx={{
                            bgcolor: 'white',
                            color: 'primary.main',
                            px: 4,
                            py: 1.5,
                            fontWeight: 'bold',
                            borderRadius: 8,
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.9)',
                            },
                        }}
                    >
                        Smart Generate
                    </Button>

                    <Button
                        variant="text"
                        startIcon={<Settings />}
                        onClick={onManualMode}
                        sx={{
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)',
                            },
                        }}
                    >
                        Customize
                    </Button>
                </Box>
            </Box>
        </Paper>
    )
}
