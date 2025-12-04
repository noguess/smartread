import { useState, useEffect, useMemo } from 'react'
import { Box, Typography, Paper, LinearProgress, Stack, Chip } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { AutoAwesome, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { Word } from '../../services/db'

interface GenerationLoadingProps {
    words: Word[]
}

export default function GenerationLoading({ words }: GenerationLoadingProps) {
    const { t } = useTranslation(['reading'])
    const [progress, setProgress] = useState(0)
    const [activeStep, setActiveStep] = useState(0)
    const [logs, setLogs] = useState<string[]>([])

    const steps = useMemo(() => [
        { id: 'analyze', label: t('reading:generating.steps.analyze', 'Analyzing vocabulary...') },
        { id: 'structure', label: t('reading:generating.steps.structure', 'Structuring article...') },
        { id: 'draft', label: t('reading:generating.steps.draft', 'Drafting content...') },
        { id: 'questions', label: t('reading:generating.steps.questions', 'Generating questions...') },
        { id: 'finalize', label: t('reading:generating.steps.finalize', 'Finalizing...') },
    ], [t])

    useEffect(() => {
        // Simulate progress
        const totalDuration = 45000 // 45 seconds estimated
        const interval = 100
        const stepsCount = steps.length

        let currentProgress = 0
        let lastStepIndex = -1

        const timer = setInterval(() => {
            currentProgress += (interval / totalDuration) * 100

            // Non-linear progress for realism
            if (currentProgress > 90) {
                currentProgress += 0.01 // Slow down at the end
            }

            if (currentProgress >= 100) {
                currentProgress = 99 // Wait for actual completion
            }

            setProgress(currentProgress)

            // Update active step based on progress
            const stepIndex = Math.floor((currentProgress / 100) * stepsCount)
            if (stepIndex !== lastStepIndex && stepIndex < stepsCount) {
                lastStepIndex = stepIndex
                setActiveStep(stepIndex)
                setLogs(prev => [...prev, steps[stepIndex].label])
            }

        }, interval)

        return () => clearInterval(timer)
    }, [steps])

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
                        animate={{ pathLength: progress / 100 }}
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
                        {Math.round(progress)}%
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
                height: 150,
                overflow: 'hidden',
                position: 'relative'
            }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, p: 1, bgcolor: '#2d2d2d', display: 'flex', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27c93f' }} />
                </Box>
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <AnimatePresence initial={false}>
                        {logs.slice(-5).map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <span style={{ opacity: 0.5 }}>{new Date().toLocaleTimeString()}</span> {'>'} {log}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                        _
                    </motion.div>
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
