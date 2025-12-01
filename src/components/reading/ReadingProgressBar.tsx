import { useState, useEffect } from 'react'
import { LinearProgress, Box } from '@mui/material'

export default function ReadingProgressBar() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
            const scrolled = (winScroll / height) * 100
            setProgress(scrolled)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <Box sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 1100 }}>
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 3,
                    '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #4A90E2 0%, #7B68EE 100%)',
                    }
                }}
            />
        </Box>
    )
}
