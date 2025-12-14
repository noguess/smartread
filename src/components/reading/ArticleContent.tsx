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
}

export default function ArticleContent({
    title,
    content,
    onWordClick,
    onSelection,
    fontSize,
    wordCount = 0,
    difficultyLevel = 'Level 2'
}: ArticleContentProps) {
    const { t } = useTranslation(['reading'])
    const [showHint, setShowHint] = useState(false)

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
                data-testid="article-card"
                sx={{
                    width: '100%', // Fill the Grid column (9/12)
                    p: { xs: 3, md: 6, lg: 8 }, // p-8 sm:p-12 lg:p-16 in read.html
                    borderRadius: 8, // rounded-[2rem]
                    minHeight: '85vh',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // shadow-sm
                    position: 'relative'
                }}
            >
                {/* Metadata Header */}
                <Box sx={{ mb: 6, maxWidth: '750px' }} data-testid="metadata-header">
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label={difficultyLevel}
                            size="small"
                            sx={{
                                bgcolor: '#ecfdf5', // emerald-50
                                color: '#047857',   // emerald-700
                                border: '1px solid #d1fae5', // emerald-100
                                borderRadius: 1.5, // rounded-md
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.75rem',
                                height: 24
                            }}
                        />
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                            <MenuBook sx={{ fontSize: 14 }} />
                            <Typography variant="caption" fontWeight="500" color="text.secondary">
                                {t('reading:meta.wordCount', { count: wordCount })}
                            </Typography>
                        </Stack>

                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>|</Typography>

                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                            <Typography variant="caption" fontWeight="500" color="text.secondary">
                                {t('reading:meta.duration', { minutes: readingTime })}
                            </Typography>
                        </Stack>
                    </Stack>



                    <Typography
                        variant="h1"
                        sx={{
                            color: 'text.primary',
                            fontSize: { xs: '2rem', md: '3rem', lg: '3.5rem' },
                            fontWeight: 800,
                            lineHeight: 1.2
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                {/* Content */}
                <Box
                    data-testid="article-text-container"
                    className={styles.articleContent}
                    onMouseUp={handleSelection} // Trigger on mouse up
                    onTouchEnd={handleSelection} // Trigger on touch end (for mobile/tablet)
                    onContextMenu={(e) => e.preventDefault()} // Block system context menu
                    sx={{
                        maxWidth: '65ch', // Constraint TEXT, not CONTAINER
                        fontSize: fontSize,
                        lineHeight: 1.9, // Relaxed line height like read.html
                        color: 'text.secondary',
                        '& p': {
                            marginBottom: '32px', // mb-8
                            // textAlign: 'justify', // read.html usually creates left-aligned prose, let's stick to standard or justify if preferred.
                            // textJustify: 'inter-word'
                        },
                    }}
                >
                    <ReactMarkdown
                        components={{
                            strong: ({ node: _node, ...props }) => (
                                <span
                                    className={styles.targetWord}
                                    style={{
                                        fontWeight: 600,
                                        color: '#2563eb', // indigo-600/blue-600
                                        background: 'linear-gradient(180deg, transparent 65%, #dbeafe 65%)', // heavy bottom underline
                                        cursor: onWordClick ? 'pointer' : 'default',
                                        padding: '0 2px',
                                        borderRadius: '2px',
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

                {/* Footer */}
                <Box
                    sx={{
                        mt: 10,
                        pt: 4,
                        borderTop: '1px solid',
                        borderColor: 'divider', // slate-100
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'text.secondary',
                        maxWidth: '65ch', // Match article width
                    }}
                >
                    <Stack direction="row" spacing={1} alignItems="center">
                        {/* CheckCircle2 equivalent */}
                        <Box sx={{ color: 'success.main', display: 'flex' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {t('reading:footer.finished', 'Reading finished?')}
                        </Typography>
                    </Stack>
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
            </Paper >
        </Box >
    )
}
