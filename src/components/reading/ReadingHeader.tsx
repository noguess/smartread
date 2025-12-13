
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Typography,
    IconButton,
    Divider,
    Stack,
    AppBar,
    Toolbar,
    useTheme
} from '@mui/material'
import {
    ChevronLeft,
    Remove,
    Add,
    FormatSize,
    AccessTime,
    PlayArrow,
    Pause,
    RestartAlt
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

interface ReadingHeaderProps {
    title: string
    fontSize: number
    onFontSizeChange: (newSize: number) => void
    isTimerRunning: boolean
    seconds: number
    onTimerToggle: () => void
    onTimerReset: () => void
    showFontControls?: boolean
}

export default function ReadingHeader({
    title,
    fontSize,
    onFontSizeChange,
    isTimerRunning,
    seconds,
    onTimerToggle,
    onTimerReset,
    showFontControls = true
}: ReadingHeaderProps) {
    const { t } = useTranslation(['reading', 'common'])
    const navigate = useNavigate()
    const theme = useTheme()

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(Math.max(0, totalSeconds) / 60).toString().padStart(2, '0')
        const s = (Math.max(0, totalSeconds) % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const MIN_FONT_SIZE = 14
    const MAX_FONT_SIZE = 26

    return (
        <AppBar
            position="sticky"
            color="inherit"
            elevation={0}
            sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                zIndex: theme.zIndex.appBar
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
                {/* Left: Back & Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        aria-label={t('common:button.back', 'Back')}
                        sx={{
                            borderRadius: 2,
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <ChevronLeft />
                    </IconButton>
                    <Typography
                        variant="h6"
                        component="h1"
                        noWrap
                        sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                {/* Right: Controls */}
                <Stack direction="row" alignItems="center" spacing={{ xs: 1, md: 3 }}>

                    {/* Font Size Control (Hidden on very small screens if needed, strictly keeping mostly desktop refined first) */}
                    {showFontControls && (
                        <>
                            <Box
                                sx={{
                                    display: { xs: 'none', md: 'flex' },
                                    alignItems: 'center',
                                    gap: 1,
                                    bgcolor: 'action.hover',
                                    p: 0.5,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => onFontSizeChange(Math.max(MIN_FONT_SIZE, fontSize - 2))}
                                    disabled={fontSize <= MIN_FONT_SIZE}
                                    aria-label={t('reading:toolbar.decreaseFont', 'Decrease font size')}
                                    sx={{ borderRadius: 1.5 }}
                                >
                                    <Remove fontSize="small" />
                                </IconButton>

                                <Stack direction="row" alignItems="center" justifyContent="center" sx={{ minWidth: 40, px: 1 }}>
                                    <FormatSize sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="body2" fontWeight="500">
                                        {fontSize}
                                    </Typography>
                                </Stack>

                                <IconButton
                                    size="small"
                                    onClick={() => onFontSizeChange(Math.min(MAX_FONT_SIZE, fontSize + 2))}
                                    disabled={fontSize >= MAX_FONT_SIZE}
                                    aria-label={t('reading:toolbar.increaseFont', 'Increase font size')}
                                    sx={{ borderRadius: 1.5 }}
                                >
                                    <Add fontSize="small" />
                                </IconButton>
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, height: 24, alignSelf: 'center' }} />
                        </>
                    )}

                    {/* Timer Control */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                color: 'primary.main',
                                px: 1.5,
                                py: 0.8,
                                borderRadius: 2,
                                fontWeight: 'medium',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.08)' // Indigo-50 equivalent
                            }}
                        >
                            {isTimerRunning ?
                                <AccessTime sx={{ fontSize: 18, animation: 'pulse 2s infinite' }} /> :
                                <Pause sx={{ fontSize: 18 }} />
                            }
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                {formatTime(seconds)}
                            </Typography>
                        </Box>

                        <IconButton
                            onClick={onTimerReset}
                            color="default"
                            aria-label={t('reading:timer.reset', 'Reset timer')}
                            sx={{
                                borderRadius: 2,
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <RestartAlt />
                        </IconButton>

                        <IconButton
                            onClick={onTimerToggle}
                            color="primary"
                            aria-label={isTimerRunning ? t('reading:timer.pause', 'Pause timer') : t('reading:timer.resume', 'Resume timer')}
                            sx={{
                                borderRadius: 2,
                                bgcolor: 'transparent',
                                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.08)' }
                            }}
                        >
                            {isTimerRunning ? <Pause /> : <PlayArrow />}
                        </IconButton>
                    </Box>
                </Stack>
            </Toolbar>
        </AppBar>
    )
}
