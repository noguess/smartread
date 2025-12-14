import { Paper, Typography, Box, Chip, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from 'react'
import styles from '../../styles/reading.module.css'
import { MenuBook, ArrowUpward } from '@mui/icons-material'

interface ArticleContentProps {
    title: string
    content: string
    onWordClick?: (word: string) => void
    onSelection?: (text: string, position: { top: number, left: number }) => void
    fontSize: number
    wordCount?: number
    difficultyLevel?: string
    scrollToWord?: string | null // New prop to trigger scroll
}

export default function ArticleContent({
    title,
    content,
    onWordClick,
    onSelection,
    fontSize,
    wordCount = 0,
    difficultyLevel = 'Level 2',
    scrollToWord
}: ArticleContentProps) {
    const { t } = useTranslation(['reading'])
    const [showHint, setShowHint] = useState(false)

    // Handle scroll to word request
    useEffect(() => {
        if (scrollToWord) {
            const wordId = `word-${scrollToWord.toLowerCase()}`
            const element = document.getElementById(wordId)

            if (element) {
                // 1. Scroll into view
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })

                // 2. Add temporary flash highlight
                element.classList.add(styles.flashHighlight)

                // 3. Remove class after animation (2000ms as requested)
                const timer = setTimeout(() => {
                    element.classList.remove(styles.flashHighlight)
                }, 2000)

                return () => clearTimeout(timer)
            }
        }
    }, [scrollToWord])

    // Calculate reading time
    // WPM based on difficulty (Slower for difficulty)
    // L1: 60, L2: 50, L3+: 40
    const wpm = (() => {
        const level = (difficultyLevel || 'L2').toUpperCase()
        if (level.includes('1')) return 60
        if (level.includes('2')) return 50
        return 40
    })()

    const readingTime = Math.max(1, Math.ceil(wordCount / wpm))

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

    const handleSelection = () => {
        if (!onSelection) return

        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        const text = selection.toString().trim()

        // Allow any selection longer than 1 char (single words or sentences)
        if (text && text.length > 1) {
            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()

            // Calculate absolute position
            onSelection(text, {
                top: rect.bottom, // Show below the selection
                left: rect.left + rect.width / 2 // Center horizontally
            })
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
                    maxWidth: 1000,
                    margin: '0 auto',
                    p: { xs: 3, md: 5, lg: 7 }, // Reduced padding by ~30%
                    borderRadius: 3,
                    minHeight: '60vh',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
                }}
            >
                {/* Metadata Header */}
                <Box sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label={difficultyLevel}
                            size="small"
                            sx={{
                                bgcolor: 'success.light',
                                color: 'success.dark',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.75rem',
                                height: 24
                            }}
                        />
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                            <MenuBook sx={{ fontSize: 16 }} />
                            <Typography variant="body2" component="span">
                                {t('reading:meta.wordCount', { count: wordCount })}
                            </Typography>
                        </Stack>

                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>•</Typography>

                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                            {/* <AccessTime sx={{ fontSize: 16 }} /> */}
                            <Typography variant="body2" component="span">
                                {t('reading:meta.duration', { minutes: readingTime })}
                            </Typography>
                        </Stack>
                    </Stack>

                    <Typography
                        variant="h1"
                        sx={{
                            color: 'text.primary',
                            fontSize: { xs: '1.5rem', md: '2rem', lg: '2.25rem' }, // Reduced from 3.5rem
                            fontWeight: 800,
                            lineHeight: 1.2
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                {/* Content */}
                <Box
                    className={styles.articleContent}
                    onMouseUp={handleSelection} // Trigger on mouse up
                    onTouchEnd={handleSelection} // Trigger on touch end (for mobile/tablet)
                    onContextMenu={(e) => e.preventDefault()} // Block system context menu
                    sx={{
                        fontSize: fontSize,
                        lineHeight: 2.2, // Increased from 1.8 (+20%)
                        color: 'text.primary',
                        '& p': {
                            marginBottom: '24px',
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                        },
                        // Drop cap effect for first letter
                        '& p:first-of-type::first-letter': {
                            float: 'left',
                            fontSize: '3.5em',
                            lineHeight: 0.8,
                            margin: '0.1em 0.1em 0 0',
                            color: 'primary.main',
                            fontWeight: 800
                        }
                    }}
                >
                    <ReactMarkdown
                        components={{
                            strong: ({ node: _node, ...props }) => {
                                // Helper to get text for ID (safely)
                                // @ts-ignore
                                const text = props.children?.[0] ? String(props.children).toLowerCase() : '';
                                return (
                                    <span
                                        id={`word-${text}`}
                                        className={styles.targetWord}
                                        style={{
                                            fontWeight: 400,
                                            color: 'inherit',
                                            // borderBottom removed in favor of text-decoration for better positioning control
                                            textDecoration: 'underline',
                                            textDecorationStyle: 'dashed',
                                            textDecorationColor: '#cbd5e1',
                                            textDecorationThickness: '2px',
                                            textUnderlineOffset: '2px', // Closer to text (default is often auto/larger)
                                            background: 'transparent',
                                            cursor: onWordClick ? 'pointer' : 'default',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onClick={onWordClick ? handleWordClick : undefined}
                                        {...props}
                                    />
                                )
                            },
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        mt: 8,
                        pt: 4,
                        borderTop: '1px dashed',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'text.disabled',
                    }}
                >
                    <Typography variant="body2" color="inherit">
                        {t('reading:footer.finished', 'Reading finished?')}
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main' },
                            transition: 'color 0.2s'
                        }}
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                            document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
                            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                    >
                        <Typography variant="body2" color="inherit" fontWeight="500">
                            {t('reading:footer.backToTop', 'Back to Top')}
                        </Typography>
                        <ArrowUpward sx={{ fontSize: 16 }} />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
