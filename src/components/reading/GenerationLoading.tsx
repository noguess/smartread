import { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Paper, Typography, Grid, useTheme, useMediaQuery } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import { PartialArticleData } from '../../services/llmService'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Word } from '../../services/db'

interface GenerationLoadingProps {
    words: Word[]
    realProgress?: number
    mode?: 'article' | 'quiz'
    partialData?: PartialArticleData
}

export default function GenerationLoading({ words: _words, realProgress = 0, mode = 'article', partialData }: GenerationLoadingProps) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const { t } = useTranslation(['reading'])
    const [activeStep, setActiveStep] = useState(0)
    const [logs, setLogs] = useState<Array<{ timestamp: Date; label: string; duration?: number }>>([])
    const [stepStartTime, setStepStartTime] = useState(new Date())
    const [currentStepDuration, setCurrentStepDuration] = useState(0)

    // Use ref to prevent flickering - once 100%, always 100%
    // const hasReached100Ref = useRef(false)
    // const [simulatedProgress, setSimulatedProgress] = useState(0)
    const [finalProgress, setFinalProgress] = useState(0)

    const steps = useMemo(() => {
        if (mode === 'quiz') {
            return [
                { id: 'analyze', label: t('reading:generatingQuiz.steps.analyze', 'Analyzing content...') },
                { id: 'reading', label: t('reading:generatingQuiz.steps.reading', 'Creating reading questions...') },
                { id: 'vocab', label: t('reading:generatingQuiz.steps.vocab', 'Extracting vocabulary questions...') },
                { id: 'options', label: t('reading:generatingQuiz.steps.options', 'Generating distractors...') },
                { id: 'finalize', label: t('reading:generatingQuiz.steps.finalize', 'Finalizing quiz...') },
            ]
        }
        return [
            { id: 'analyze', label: t('reading:generating.steps.analyze', 'Analyzing vocabulary...') },
            { id: 'generating', label: t('reading:generating.steps.generating', 'Generating article...') },
            { id: 'optimizing', label: t('reading:generating.steps.optimizing', 'Optimizing content...') },
        ]
    }, [t, mode])

    // Initialize first step on mount
    useEffect(() => {
        const now = new Date()
        setStepStartTime(now)
        setLogs([{
            timestamp: now,
            label: steps[0].label
        }])
        // Reset state when mode or steps change
        setActiveStep(0)
    }, [steps])

    // Real-time current step duration tracker
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - stepStartTime.getTime()) / 1000)
            setCurrentStepDuration(elapsed)
        }, 1000)

        return () => clearInterval(timer)
    }, [stepStartTime])

    // Quiz Simulation (runs independently)
    useEffect(() => {
        if (mode !== 'quiz') return

        const totalDuration = 15000
        const interval = 100
        let currentProgress = 0

        const timer = setInterval(() => {
            currentProgress += (interval / totalDuration) * 100
            if (currentProgress > 99) currentProgress = 99
            setFinalProgress(currentProgress)
        }, interval)

        return () => clearInterval(timer)
    }, [mode])

    // Step Progression Logic
    useEffect(() => {
        let targetStep = 0

        if (mode === 'quiz') {
            // Quiz: Driven by simulated finalProgress
            targetStep = Math.floor((finalProgress / 100) * steps.length)
        } else {
            // Article: Driven by partialData
            if (partialData?.content || partialData?.title) {
                targetStep = 1 // Generating
            }
            if (partialData?.word_study) { // Only trigger on word_study (final metadata)
                targetStep = 2 // Optimizing
            }
            // Completion check
            if (realProgress >= 100) {
                targetStep = 2
            }
        }

        // Clamp targetStep
        if (targetStep >= steps.length) targetStep = steps.length - 1

        if (targetStep !== activeStep) {
            const now = new Date()
            const previousStepDuration = Math.floor((now.getTime() - stepStartTime.getTime()) / 1000)

            if (logs.length > 0) {
                setLogs(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1].duration = previousStepDuration
                    return updated
                })
            }

            setActiveStep(targetStep)
            setStepStartTime(now)
            setCurrentStepDuration(0)
            setLogs(prev => [...prev, {
                timestamp: now,
                label: steps[targetStep].label
            }])
        }

    }, [partialData, realProgress, mode, activeStep, steps, logs.length, stepStartTime, finalProgress])

    const logsEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const showPreview = mode === 'article' && partialData && (partialData.title || partialData.content);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            width: '100%',
            maxWidth: showPreview ? 1200 : 800,
            mx: 'auto',
            transition: 'max-width 0.5s ease',
            px: 2
        }}>
            <Grid container spacing={4} alignItems={showPreview && !isMobile ? "flex-start" : "center"} justifyContent="center">
                {/* Terminal Log View */}
                <Grid item xs={12} md={showPreview ? 5 : 12} lg={showPreview ? 4 : 12}>
                    <Paper elevation={4} sx={{
                        width: '100%',
                        // maxWidth: showPreview ? '100%' : 600, // Let Grid handle width
                        bgcolor: '#1e1e1e',
                        color: '#00ff00',
                        p: 3,
                        borderRadius: 2,
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        minHeight: 300,
                        maxHeight: 500,
                        overflowY: 'auto',
                        position: 'relative',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        '&::-webkit-scrollbar': { width: '8px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: '#333', borderRadius: '4px' },
                        transition: 'all 0.5s ease'
                    }}>
                        {/* Traffic Light Dots */}
                        <Box sx={{
                            position: 'sticky', top: -24, left: 0, right: 0,
                            p: 1.5, mb: 2, bgcolor: '#2d2d2d',
                            display: 'flex', gap: 1,
                            mx: -3, mt: -3, px: 3,
                            borderBottom: '1px solid #333'
                        }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#27c93f' }} />
                            <Box sx={{ ml: 'auto', color: '#888', fontSize: '0.8rem' }}>
                                {mode === 'quiz' ? t('reading:generating.terminal.quiz') : t('reading:generating.terminal.article')}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                            <AnimatePresence initial={false}>
                                {logs.map((log, i) => {
                                    const isCurrentStep = i === logs.length - 1
                                    const duration = isCurrentStep ? currentStepDuration : log.duration

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            <span style={{ opacity: 0.5, marginRight: '8px' }}>
                                                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                            <span style={{ color: '#00ff00', marginRight: '8px' }}>➜</span>
                                            {log.label}
                                            {duration !== undefined && duration >= 0 && (
                                                <span style={{ opacity: 0.7, float: 'right' }}>
                                                    {duration}s
                                                </span>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>

                            {/* Blinking Cursor */}
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                style={{ marginTop: '8px' }}
                            >
                                _
                            </motion.div>
                            <div ref={logsEndRef} />
                        </Box>
                    </Paper>
                </Grid>

                {/* Live Preview Panel */}
                <AnimatePresence>
                    {showPreview && (
                        <Grid item xs={12} md={7} lg={8} component={motion.div}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Paper elevation={2} sx={{
                                p: { xs: 3, md: 5 },
                                borderRadius: 3,
                                minHeight: 400,
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                bgcolor: 'background.paper',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                border: '1px solid',
                                borderColor: 'divider',
                            }}>
                                {partialData?.title && (
                                    <Typography variant="h2" sx={{
                                        fontSize: { xs: '1.5rem', md: '2rem' },
                                        fontWeight: 800,
                                        mb: 3,
                                        color: 'text.primary'
                                    }}>
                                        {partialData.title}
                                    </Typography>
                                )}

                                <Box sx={{
                                    typography: 'body1',
                                    fontSize: '1.1rem',
                                    lineHeight: 1.8,
                                    color: 'text.primary',
                                    '& p': { mb: 2, textAlign: 'justify' }
                                }}>
                                    <ReactMarkdown>
                                        {partialData?.content || ''}
                                    </ReactMarkdown>
                                </Box>

                                {(!partialData?.content || partialData.content.length < 50) && (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                        <motion.div
                                            style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#cbd5e1' }}
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.div
                                            style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#cbd5e1' }}
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                        />
                                        <motion.div
                                            style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#cbd5e1' }}
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                        />
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    )}
                </AnimatePresence>
            </Grid>
        </Box>
    )
}
