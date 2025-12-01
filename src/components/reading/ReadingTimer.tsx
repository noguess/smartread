import { useState, useEffect } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { AccessTime as TimeIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

export default function ReadingTimer() {
    const { t } = useTranslation(['reading'])
    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(prev => prev + 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getReadableTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60

        if (mins === 0) {
            return t('reading:timer.seconds', { count: secs })
        } else if (secs === 0) {
            return t('reading:timer.minutes', { count: mins })
        } else {
            return t('reading:timer.minutesAndSeconds', { minutes: mins, seconds: secs })
        }
    }

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2.5,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textAlign: 'center'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <TimeIcon sx={{ fontSize: '1.2rem' }} />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {t('reading:timer.label')}
                </Typography>
            </Box>

            <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    mb: 0.5
                }}
            >
                {formatTime(seconds)}
            </Typography>

            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                {getReadableTime(seconds)}
            </Typography>
        </Paper>
    )
}
