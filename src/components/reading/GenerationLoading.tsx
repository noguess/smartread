import { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Typography, Paper, Stack, Chip } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { AutoAwesome, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { Word } from '../../services/db'

interface GenerationLoadingProps {
    words: Word[]
    realProgress?: number // Real download progress from API (0-100)
}

export default function GenerationLoading({ words, realProgress = 0 }: GenerationLoadingProps) {
    const { t } = useTranslation(['reading'])
    const [simulatedProgress, setSimulatedProgress] = useState(0)
    const [activeStep, setActiveStep] = useState(0)
    const [logs, setLogs] = useState<Array<{ timestamp: Date; label: string; duration?: number }>>([])
    const [stepStartTime, setStepStartTime] = useState(new Date())
    const [currentStepDuration, setCurrentStepDuration] = useState(0)
    const [typingWordIndex, setTypingWordIndex] = useState(0)
    const [typingCharIndex, setTypingCharIndex] = useState(0)

    // Use ref to prevent flickering - once 100%, always 100%
    const hasReached100Ref = useRef(false)
    const [finalProgress, setFinalProgress] = useState(0)

    const steps = useMemo(() => [
        { id: 'analyze', label: t('reading:generating.steps.analyze', 'Analyzing vocabulary...') },
        { id: 'structure', label: t('reading:generating.steps.structure', 'Structuring article...') },
        { id: 'draft', label: t('reading:generating.steps.draft', 'Drafting content...') },
        { id: 'questions', label: t('reading:generating.steps.questions', 'Generating questions...') },
        { id: 'finalize', label: t('reading:generating.steps.finalize', 'Finalizing...') },
    ], [t])

    // Initialize first step on mount
    useEffect(() => {
        const now = new Date()
        setStepStartTime(now)
        setLogs([{
            timestamp: now,
            label: steps[0].label
        }])
    }, [steps])

    // Word typing animation (only for first step)
    useEffect(() => {
        if (activeStep !== 0 || typingWordIndex >= words.length) return

        const currentWord = words[typingWordIndex]?.spelling || ''

        if (typingCharIndex < currentWord.length) {
            const timer = setTimeout(() => {
                setTypingCharIndex(prev => prev + 1)
            }, 50) // Type each character every 50ms
            return () => clearTimeout(timer)
        } else {
            // Finished current word, move to next after a pause
            const timer = setTimeout(() => {
                setTypingWordIndex(prev => prev + 1)
                setTypingCharIndex(0)
            }, 200) // Pause between words
            return () => clearTimeout(timer)
        }
    }, [activeStep, typingWordIndex, typingCharIndex, words])

    // Real-time current step duration tracker
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - stepStartTime.getTime()) / 1000)
            setCurrentStepDuration(elapsed)
        }, 1000) // Update every second

        return () => clearInterval(timer)
    }, [stepStartTime])

    // Simulated progress (runs independently)
    useEffect(() => {
        const totalDuration = 45000 // 45 seconds estimated
        const interval = 100

        let currentProgress = 0

        const timer = setInterval(() => {
            // Don't update if already at 100%
            if (hasReached100Ref.current) {
                clearInterval(timer)
                return
            }

            currentProgress += (interval / totalDuration) * 100

            // Non-linear progress for realism
            if (currentProgress > 90) {
                currentProgress += 0.01 // Slow down at the end
            }

            if (currentProgress >= 100) {
                currentProgress = 99 // Wait for actual completion
            }

            setSimulatedProgress(currentProgress)
        }, interval)

        return () => clearInterval(timer)
    }, [])

    // Blend simulated and real progress, and lock at 100%
    useEffect(() => {
        // Once locked at 100%, never change
        if (hasReached100Ref.current) {
            setFinalProgress(100)
            return
        }

        let displayValue: number

        if (realProgress === 0) {
            // No real data yet, use simulated
            displayValue = simulatedProgress
        } else if (realProgress >= 100) {
            // Real progress says we're done - lock immediately
            displayValue = 100
            hasReached100Ref.current = true
        } else {
            // Blend: take the max to ensure progress never goes backwards
            const blended = Math.max(
                simulatedProgress,
                realProgress * 0.7 + simulatedProgress * 0.3
            )
            displayValue = Math.min(blended, 99) // Cap at 99 until truly done
        }

        setFinalProgress(displayValue)
    }, [simulatedProgress, realProgress])

    // Lock progress at 100 once ref is set
    const displayProgress = useMemo(() => {
        return hasReached100Ref.current ? 100 : finalProgress
    }, [finalProgress])

    // Update active step based on display progress
    useEffect(() => {
        const stepIndex = Math.floor((displayProgress / 100) * steps.length)
        if (stepIndex !== activeStep && stepIndex < steps.length) {
            const now = new Date()
            const previousStepDuration = Math.floor((now.getTime() - stepStartTime.getTime()) / 1000)

            // Update the last log entry with duration (if exists)
            if (logs.length > 0) {
                setLogs(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1].duration = previousStepDuration
                    return updated
                })
            }

            // Add new step log
            setActiveStep(stepIndex)
            setStepStartTime(now)
            setCurrentStepDuration(0) // Reset current step duration
            setLogs(prev => [...prev, {
                timestamp: now,
                label: steps[stepIndex].label
            }])
        }
    }, [displayProgress, activeStep, steps, stepStartTime, logs.length])

    const logsEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when logs change
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs, typingCharIndex])

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 4,
            width: '100%',
            maxWidth: 800,
            mx: 'auto'
        }}>
            {/* Main Progress Circle */}
            <Box sx={{ position: 'relative', width: 120, height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="8"
                    />
                    <motion.circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="#4A90E2"
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: displayProgress / 100 }}
                        transition={{ duration: 0.5, ease: "linear" }}
                        style={{ rotate: -90, transformOrigin: "50% 50%" }}
                    />
                </svg>
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <AutoAwesome sx={{ color: '#4A90E2', fontSize: 32, mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        {Math.round(displayProgress)}%
                    </Typography>
                </Box>
            </Box>

            {/* Current Step & Status */}
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom component={motion.div}
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {steps[activeStep]?.label || 'Processing...'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {t('reading:generating.subtitle', { count: words.length })}
                </Typography>
            </Box>

            {/* Steps Visualization */}
            <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'center' }}>
                {steps.map((step, index) => (
                    <Box key={step.id} sx={{ display: 'flex', alignItems: 'center', opacity: index <= activeStep ? 1 : 0.3 }}>
                        {index < activeStep ? (
                            <CheckCircle color="success" fontSize="small" />
                        ) : index === activeStep ? (
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <RadioButtonUnchecked color="primary" fontSize="small" />
                            </motion.div>
                        ) : (
                            <RadioButtonUnchecked color="disabled" fontSize="small" />
                        )}
                    </Box>
                ))}
            </Stack>

            {/* Terminal Log View */}
            <Paper elevation={0} sx={{
                width: '100%',
                bgcolor: '#1e1e1e',
                color: '#00ff00',
                p: 2,
                borderRadius: 2,
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                height: 180, // Increased height
                overflowY: 'auto', // Allow scrolling
                position: 'relative',
                '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar
                scrollbarWidth: 'none' // Hide scrollbar Firefox
            }}>
                <Box sx={{ position: 'sticky', top: -16, left: 0, right: 0, p: 1, mb: 1, bgcolor: '#2d2d2d', display: 'flex', gap: 1, zIndex: 1, mx: -2, mt: -2, px: 2 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27c93f' }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <AnimatePresence initial={false}>
                        {logs.map((log, i) => { // Show all logs, let scroll handle visibility
                            const isCurrentStep = i === logs.length - 1
                            const duration = isCurrentStep ? currentStepDuration : log.duration

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <span style={{ opacity: 0.5 }}>
                                        {log.timestamp.toLocaleTimeString()}
                                    </span>
                                    {' > '}
                                    {log.label}
                                    {duration !== undefined && duration > 0 && (
                                        <span style={{ opacity: 0.7, marginLeft: '8px' }}>
                                            ({duration}s)
                                        </span>
                                    )}
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>

                    {/* Show typing words during first step */}
                    {activeStep === 0 && typingWordIndex < words.length && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ color: '#ffbd2e', marginLeft: '16px' }}
                        >
                            {words.slice(0, typingWordIndex).map(w => w.spelling).join(', ')}
                            {typingWordIndex > 0 && ', '}
                            {words[typingWordIndex]?.spelling.substring(0, typingCharIndex)}
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                            >
                                _
                            </motion.span>
                        </motion.div>
                    )}

                    {/* Blinking cursor for other steps */}
                    {(activeStep !== 0 || typingWordIndex >= words.length) && (
                        <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                        >
                            _
                        </motion.div>
                    )}
                    <div ref={logsEndRef} />
                </Box>
            </Paper>

            {/* Target Words Preview */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', opacity: 0.7 }}>
                {words.map((word, i) => (
                    <Chip
                        key={i}
                        label={word.spelling}
                        size="small"
                        variant="outlined"
                        component={motion.div}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                    />
                ))}
            </Box>
        </Box>
    )
}
