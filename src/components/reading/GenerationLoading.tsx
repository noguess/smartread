import { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Paper } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Word } from '../../services/db'

interface GenerationLoadingProps {
    words: Word[]
    realProgress?: number
    mode?: 'article' | 'quiz'
}

export default function GenerationLoading({ words: _words, realProgress = 0, mode = 'article' }: GenerationLoadingProps) {
    const { t } = useTranslation(['reading'])
    const [activeStep, setActiveStep] = useState(0)
    const [logs, setLogs] = useState<Array<{ timestamp: Date; label: string; duration?: number }>>([])
    const [stepStartTime, setStepStartTime] = useState(new Date())
    const [currentStepDuration, setCurrentStepDuration] = useState(0)

    // Use ref to prevent flickering - once 100%, always 100%
    const hasReached100Ref = useRef(false)
    const [simulatedProgress, setSimulatedProgress] = useState(0)
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
            { id: 'structure', label: t('reading:generating.steps.structure', 'Structuring article...') },
            { id: 'draft', label: t('reading:generating.steps.draft', 'Drafting content...') },
            { id: 'questions', label: t('reading:generating.steps.questions', 'Generating questions...') },
            { id: 'finalize', label: t('reading:generating.steps.finalize', 'Finalizing...') },
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
        hasReached100Ref.current = false
        setSimulatedProgress(0)
        setFinalProgress(0)
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

    // Simulated progress (runs independently)
    useEffect(() => {
        const totalDuration = mode === 'quiz' ? 15000 : 45000 // Quiz is faster
        const interval = 100
        let currentProgress = 0

        const timer = setInterval(() => {
            if (hasReached100Ref.current) {
                clearInterval(timer)
                return
            }

            currentProgress += (interval / totalDuration) * 100
            if (currentProgress > 90) currentProgress += 0.01
            if (currentProgress >= 100) currentProgress = 99

            setSimulatedProgress(currentProgress)
        }, interval)

        return () => clearInterval(timer)
    }, [mode])

    // Blend simulated and real progress
    useEffect(() => {
        if (hasReached100Ref.current) {
            setFinalProgress(100)
            return
        }

        let displayValue: number
        if (realProgress >= 100) {
            displayValue = 100
            hasReached100Ref.current = true
        } else if (realProgress === 0) {
            displayValue = simulatedProgress
        } else {
            const blended = Math.max(simulatedProgress, realProgress * 0.7 + simulatedProgress * 0.3)
            displayValue = Math.min(blended, 99)
        }

        setFinalProgress(displayValue)
    }, [simulatedProgress, realProgress])

    // Update active step based on display progress
    useEffect(() => {
        const progress = hasReached100Ref.current ? 100 : finalProgress
        const stepIndex = Math.floor((progress / 100) * steps.length)

        if (stepIndex !== activeStep && stepIndex < steps.length) {
            const now = new Date()
            const previousStepDuration = Math.floor((now.getTime() - stepStartTime.getTime()) / 1000)

            if (logs.length > 0) {
                setLogs(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1].duration = previousStepDuration
                    return updated
                })
            }

            setActiveStep(stepIndex)
            setStepStartTime(now)
            setCurrentStepDuration(0)
            setLogs(prev => [...prev, {
                timestamp: now,
                label: steps[stepIndex].label
            }])
        }
    }, [finalProgress, activeStep, steps, stepStartTime, logs.length])

    const logsEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh', // Keep vertical centering
            width: '100%',
            maxWidth: 800,
            mx: 'auto'
        }}>
            {/* Terminal Log View */}
            <Paper elevation={4} sx={{
                width: '100%',
                maxWidth: 600,
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
                '&::-webkit-scrollbar-thumb': { bgcolor: '#333', borderRadius: '4px' }
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
                        {mode === 'quiz' ? 'zsh — generate-quiz' : 'zsh — generate-article'}
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
        </Box>
    )
}
