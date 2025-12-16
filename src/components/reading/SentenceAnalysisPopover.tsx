import { useState, useRef, useEffect } from 'react'
import {
    Popover,
    Typography,
    Box,
    CircularProgress,
    Button,
    IconButton,
    Drawer,
    useMediaQuery,
    useTheme
} from '@mui/material'
import { Close, AutoFixHigh } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { llmService } from '../../services/llmService'
import { Setting } from '../../services/db'
import { analysisStorageService } from '../../services/analysisStorageService'

interface SentenceAnalysisPopoverProps {
    sentence: string
    anchorPosition: { top: number; left: number } | null
    onClose: () => void
    settings: Setting
    articleId: string
}

export default function SentenceAnalysisPopover({
    sentence,
    anchorPosition,
    onClose,
    settings,
    articleId
}: SentenceAnalysisPopoverProps) {
    const { t } = useTranslation(['common'])
    const abortController = useRef<AbortController | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom as result streams in
    useEffect(() => {
        if (result && loading) {
            endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
    }, [result, loading])

    // Reset state when popover opens/closes or sentence changes
    // But since this component is likely unmounted/remounted or controlled by parent,
    // we rely on local state. Ideally, we should reset if sentence changes while open,
    // but the current usage pattern likely destroys the popover on close.
    // If props change while open, we might want to reset result, but let's keep it simple.

    const handleAnalyze = async () => {
        setLoading(true)
        setError(false)
        abortController.current = new AbortController()

        try {
            // Check cache first
            if (articleId) {
                const cached = await analysisStorageService.findMatchingAnalysis(articleId, sentence)
                if (cached) {
                    console.log('Using cached sentence analysis (fuzzy match)')
                    setResult(cached.analysisResult)
                    return // Found in cache, done
                }
            }

            const data = await llmService.analyzeSentence(sentence, settings, (token) => {
                setResult(prev => (prev || '') + token)
            }, abortController.current.signal)
            setResult(data) // Ensure full consistence at the end

            // Save to cache
            if (articleId && data) {
                await analysisStorageService.saveAnalysis(articleId, sentence, data)
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Analysis Aborted')
                // Keep result as is, stop loading
                return
            }
            console.error('Sentence analysis failed:', err)
            setError(true)
        } finally {
            setLoading(false)
            abortController.current = null
        }
    }

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const open = Boolean(anchorPosition)
    if (!open) return null

    const Content = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'background.default'
            }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                    {t('status.sentenceAnalysis', 'Sentence Analysis')}
                </Typography>
                <IconButton size="small" onClick={onClose}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            {/* Scrollable Content Area */}
            <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>

                {/* Target Sentence */}
                <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{
                        fontStyle: 'italic',
                        mb: 2,
                        borderLeft: '3px solid #1976d2',
                        pl: 1.5,
                        opacity: 0.9,
                        bgcolor: 'action.hover',
                        py: 1,
                        borderRadius: '0 4px 4px 0'
                    }}
                >
                    "{sentence}"
                </Typography>

                {!result && !loading && !error && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                            {t('msg.clickToAnalyze', 'Click to analyze grammar & translation')}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AutoFixHigh />}
                            onClick={handleAnalyze}
                            sx={{ borderRadius: 6, px: 3 }}
                        >
                            {t('button.analyze', 'Analyze')}
                        </Button>
                    </Box>
                )}

                {error && (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                            {t('msg.analysisFailed', 'Analysis failed. Please try again.')}
                        </Typography>
                        <Button size="small" variant="outlined" onClick={handleAnalyze}>
                            {t('button.retry', 'Retry')}
                        </Button>
                    </Box>
                )}

                {/* Content Area - show if result exists (streaming) OR if it's strictly the Result view */}
                {(result || loading) && (
                    <Box className="markdown-content" sx={{
                        '& h2': {
                            fontSize: '1rem',
                            fontWeight: 700,
                            mt: 2,
                            mb: 1,
                            color: 'primary.main',
                            borderBottom: '1px dashed',
                            borderColor: 'divider',
                            pb: 0.5
                        },
                        '& h3': {
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            mt: 1.5,
                            mb: 0.5
                        },
                        '& p': {
                            fontSize: '0.9rem',
                            mb: 1,
                            lineHeight: 1.6,
                            color: 'text.primary'
                        },
                        '& ul, & ol': {
                            pl: 2.5,
                            mb: 1
                        },
                        '& li': {
                            fontSize: '0.9rem',
                            mb: 0.5
                        },
                        '& strong': {
                            fontWeight: 600,
                            color: 'text.primary'
                        },
                        '& blockquote': {
                            borderLeft: '3px solid #ccc',
                            m: 0,
                            pl: 2,
                            color: 'text.secondary',
                            fontStyle: 'italic'
                        }
                    }}>
                        {!result && loading && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
                                <CircularProgress size={32} />
                                <Typography variant="caption" color="text.secondary">
                                    {t('status.analyzing', 'AI is analyzing...')}
                                </Typography>
                            </Box>
                        )}

                        {result && <ReactMarkdown>{result}</ReactMarkdown>}

                        {/* Blinking cursor at the end of streaming content */}
                        {loading && result && (
                            <Box component="span" sx={{
                                display: 'inline-block',
                                width: '8px',
                                height: '16px',
                                bgcolor: 'primary.main',
                                ml: 0.5,
                                animation: 'blink 1s step-end infinite',
                                '@keyframes blink': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0 }
                                }
                            }} />
                        )}
                        <div ref={endRef} />
                    </Box>
                )}
            </Box>
        </Box>
    )

    if (isMobile) {
        return (
            <Drawer
                anchor="bottom"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        borderRadius: '16px 16px 0 0',
                        maxHeight: '80vh', // More height for analysis
                        height: 'auto'
                    }
                }}
            >
                {Content}
            </Drawer>
        )
    }

    return (
        <Popover
            open={open}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition || undefined}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            PaperProps={{
                sx: {
                    width: 400,
                    p: 0, // Remove default padding to handle header/content cleanly
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    maxHeight: 500,
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {Content}
        </Popover>
    )
}
