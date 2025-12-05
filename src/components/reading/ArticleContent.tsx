import { Paper, Typography, Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from 'react'
import styles from '../../styles/reading.module.css'

interface ArticleContentProps {
    title: string
    content: string
    onWordClick?: (word: string) => void
    fontSize: 'small' | 'medium' | 'large'
}

const fontSizeMap = {
    small: '15px',
    medium: '17px',
    large: '19px'
}

export default function ArticleContent({ title, content, onWordClick, fontSize }: ArticleContentProps) {
    const { t } = useTranslation(['reading'])
    const [showHint, setShowHint] = useState(false)

    useEffect(() => {
        // Check if this is the first time reading
        const hasSeenHint = localStorage.getItem('reading_hint_seen')
        if (!hasSeenHint) {
            setShowHint(true)
            // Auto hide after 3 seconds
            const timer = setTimeout(() => {
                setShowHint(false)
                localStorage.setItem('reading_hint_seen', 'true')
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>) => {
        const word = e.currentTarget.textContent || ''
        if (onWordClick) {
            onWordClick(word)
        }
    }

    const handleCloseHint = () => {
        setShowHint(false)
        localStorage.setItem('reading_hint_seen', 'true')
    }

    return (
        <Box className={styles.articleContainer}>
            {/* First-time reading hint */}
            {showHint && (
                <Box
                    className={styles.readingHint}
                    onClick={handleCloseHint}
                    sx={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1200,
                        bgcolor: 'rgba(74, 144, 226, 0.95)',
                        color: 'white',
                        px: 4,
                        py: 2.5,
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        animation: 'fadeInOut 3s ease-in-out',
                        '@keyframes fadeInOut': {
                            '0%': { opacity: 0, transform: 'translate(-50%, -60%)' },
                            '10%': { opacity: 1, transform: 'translate(-50%, -50%)' },
                            '90%': { opacity: 1, transform: 'translate(-50%, -50%)' },
                            '100%': { opacity: 0, transform: 'translate(-50%, -40%)' }
                        }
                    }}
                >
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {t('reading:hint.clickWord')}
                    </Typography>
                </Box>
            )}

            <Paper
                elevation={0}
                sx={{
                    maxWidth: 860,
                    margin: '0 auto',
                    p: { xs: 3, md: 6 },
                    borderRadius: 4,
                    minHeight: '60vh',
                    bgcolor: 'background.paper'
                }}
            >
                {/* Title */}
                <Typography
                    variant="h4"
                    gutterBottom
                    fontWeight="bold"
                    align="center"
                    sx={{
                        mb: 5,
                        color: 'text.primary',
                        fontSize: { xs: '1.75rem', md: '2.125rem' }
                    }}
                >
                    {title}
                </Typography>

                {/* Content */}
                <Box
                    className={styles.articleContent}
                    sx={{
                        mt: 4,
                        fontSize: fontSizeMap[fontSize],
                        lineHeight: 1.8,
                        '& p': {
                            marginBottom: '20px',
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                        },
                        // Drop cap effect for first letter
                        '& p:first-of-type::first-letter': {
                            float: 'left',
                            fontSize: '3.5em',
                            lineHeight: 0.9,
                            margin: '0.1em 0.1em 0 0',
                            color: 'primary.main',
                            fontWeight: 'bold'
                        }
                    }}
                >
                    <ReactMarkdown
                        components={{
                            strong: ({ node, ...props }) => (
                                <span
                                    className={styles.targetWord}
                                    style={{
                                        fontWeight: 600,
                                        color: '#1976d2',
                                        background: 'linear-gradient(180deg, transparent 60%, #E3F2FD 60%)',
                                        cursor: onWordClick ? 'pointer' : 'default',
                                        padding: '2px 4px',
                                        borderRadius: '3px',
                                        position: 'relative',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onClick={onWordClick ? handleWordClick : undefined}
                                    {...props}
                                />
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </Box>
            </Paper>
        </Box>
    )
}
