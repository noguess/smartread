import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Box,
    Typography,
    Container,
    Stack,
    IconButton,
    LinearProgress,
    Paper,
    Zoom,
    Fade
} from '@mui/material'

import {
    VolumeUp as VolumeIcon,
    Mic as MicIcon,
    ArrowForward as NextIcon,
    SkipNext as SkipIcon,
    ArrowBack as BackIcon
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Word } from '../../services/db'
import { speechService } from '../../services/speechService'
import { llmService } from '../../services/llmService'
import { settingsService } from '../../services/settingsService'
import { GradientButton } from '../../components/common'

const DrillProcessPage: React.FC = () => {
    const { t } = useTranslation('drill')
    const location = useLocation()
    const navigate = useNavigate()
    const words = useMemo(() => (location.state as { words: Word[] })?.words || [], [location.state])

    const [round, setRound] = useState(1) // 1: Shadowing, 2: Reading, 3: En->Zh, 4: Zh->En
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isListening, setIsListening] = useState(false)
    const [isGrading, setIsGrading] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [matchPercent, setMatchPercent] = useState<number | null>(null)
    const [feedback, setFeedback] = useState<string>('')
    const [progress, setProgress] = useState(0)

    const currentWord = words[currentIndex]

    useEffect(() => {
        if (words.length === 0) {
            navigate('/drill/selection')
            return
        }
    }, [words, navigate])

    useEffect(() => {
        setProgress(((currentIndex + 1) / words.length) * 100)
    }, [currentIndex, words.length])

    // Clean up on unmount
    useEffect(() => {
        return () => {
            speechService.abort()
        }
    }, [])

    const playWord = useCallback((text: string) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        utterance.rate = 0.8
        window.speechSynthesis.speak(utterance)
    }, [])

    const compareStrings = (s1: string, s2: string): number => {
        const str1 = s1.toLowerCase().replace(/[^a-z]/g, '')
        const str2 = s2.toLowerCase().replace(/[^a-z]/g, '')
        if (str1 === str2) return 100
        if (str1.includes(str2) || str2.includes(str1)) return 80
        // Simple Levenshtein or just overlapping chars for mock
        return Math.floor(Math.random() * 30) + 40 // Dummy for now, real ASR is enough
    }

    const startRecording = useCallback(async () => {
        const settings = await settingsService.getSettings()
        setTranscript('')
        setMatchPercent(null)
        setFeedback('')
        setIsListening(true)

        // Lang: Round 3 is En->Zh, so we listen to Chinese
        const lang = round === 3 ? 'zh-CN' : 'en-US'

        speechService.startListening(
            lang,
            async (result) => {
                setTranscript(result.transcript)
                if (result.isFinal) {
                    setIsListening(false)

                    if (round <= 2) {
                        // For shadow/reading, use local fuzzy match
                        const score = compareStrings(result.transcript, currentWord.spelling)
                        setMatchPercent(score)
                        if (score >= 90) setFeedback('excellent')
                        else if (score >= 60) setFeedback('good')
                        else setFeedback('keep_trying')
                    } else {
                        // For translation, use AI grading
                        setIsGrading(true)
                        try {
                            // Example sentence for context if available
                            const context = currentWord.contextSentence || ""
                            const res = await llmService.gradeTranslation(
                                currentWord.spelling,
                                context,
                                result.transcript,
                                settings
                            )
                            setMatchPercent(res.score)
                            setFeedback(res.score >= 80 ? 'excellent' : res.score >= 50 ? 'good' : 'keep_trying')
                        } catch (err) {
                            console.error('Grading failed', err)
                            setFeedback('keep_trying')
                        } finally {
                            setIsGrading(false)
                        }
                    }
                }
            },
            (error) => {
                console.error(error)
                setIsListening(false)
                setFeedback('keep_trying')
            }
        )
    }, [currentWord, round])

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setTranscript('')
            setMatchPercent(null)
            setFeedback('')
        } else {
            // End of round transition
            if (round < 4) {
                setRound(prev => prev + 1 as any)
                setCurrentIndex(0)
                setTranscript('')
                setMatchPercent(null)
                setFeedback('')
            } else {
                // Final Exam
                navigate('/drill/exam', { state: { words } })
            }
        }
    }

    useEffect(() => {
        if (round === 1 && currentWord) {
            // Auto play in Round 1
            const timer = setTimeout(() => playWord(currentWord.spelling), 500)
            return () => clearTimeout(timer)
        }
    }, [currentIndex, round, currentWord, playWord])

    if (!currentWord) return null

    return (
        <Container maxWidth="md" sx={{ py: 6, minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Progress */}
            <Box sx={{ mb: 6 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
                        <BackIcon />
                    </IconButton>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">
                            {t(`process.round${round}_title`)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t(`process.round${round}_desc`)}
                        </Typography>
                    </Box>
                    <Box sx={{ width: 40 }} /> {/* Spacer */}
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 8, borderRadius: 4, bgcolor: 'divider' }}
                />
                <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', fontWeight: 'medium' }}>
                    {currentIndex + 1} / {words.length}
                </Typography>
            </Box>

            {/* Main Word Card */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${round}-${currentIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%' }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                borderRadius: 6,
                                border: '1px solid',
                                borderColor: 'divider',
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Stack spacing={4}>
                                <Box>
                                    <Typography
                                        variant="h2"
                                        fontWeight="800"
                                        gutterBottom
                                        sx={{
                                            // Round 3/4 hide the word initially
                                            filter: (round >= 3 && feedback === '') ? 'blur(12px)' : 'none',
                                            transition: 'filter 0.5s ease',
                                            display: (round === 4 && feedback === '') ? 'none' : 'block' // Round 4 specifically shows meaning as prompt
                                        }}
                                    >
                                        {currentWord.spelling}
                                    </Typography>

                                    {round === 4 && (
                                        <Typography variant="h3" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                            {currentWord.meaning}
                                        </Typography>
                                    )}

                                    <Typography
                                        variant="h5"
                                        color="primary"
                                        sx={{
                                            fontStyle: 'italic',
                                            mb: 2,
                                            visibility: (round >= 3 && feedback === '') ? 'hidden' : 'visible'
                                        }}
                                    >
                                        {currentWord.phonetic || '/.../'}
                                    </Typography>

                                    <Fade in={round <= 2 || feedback !== ''}>
                                        <Typography variant="h6" color="text.secondary">
                                            {currentWord.meaning}
                                        </Typography>
                                    </Fade>
                                </Box>

                                {/* Instruction / Feedback Area */}
                                <Box sx={{ minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    {isGrading ? (
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Typography variant="h6" color="primary.main">
                                                {t('process.grading')}
                                            </Typography>
                                        </Stack>
                                    ) : isListening ? (
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box sx={{
                                                width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main',
                                                animation: 'pulse 1.5s infinite'
                                            }} />
                                            <Typography color="error.main" fontWeight="bold">
                                                {t('process.listening')}
                                            </Typography>
                                        </Stack>
                                    ) : transcript ? (
                                        <Box>
                                            <Typography variant="h5" color="text.secondary" gutterBottom>
                                                "{transcript}"
                                            </Typography>
                                            {matchPercent !== null && (
                                                <Typography
                                                    variant="subtitle1"
                                                    fontWeight="bold"
                                                    sx={{
                                                        color: matchPercent >= 80 ? 'success.main' : matchPercent >= 50 ? 'warning.main' : 'error.main'
                                                    }}
                                                >
                                                    {t('process.match', { percent: matchPercent })} - {t(`process.${feedback}`)}
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography color="text.disabled">
                                            {round === 1 ? t('process.wait_audio') : t(`process.round${round}_desc`)}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Action Bar */}
                                <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
                                    <IconButton
                                        size="large"
                                        onClick={() => playWord(currentWord.spelling)}
                                        sx={{ bgcolor: 'primary.50', color: 'primary.main', '&:hover': { bgcolor: 'primary.100' } }}
                                    >
                                        <VolumeIcon fontSize="large" />
                                    </IconButton>

                                    <Zoom in={round >= 2}>
                                        <IconButton
                                            size="large"
                                            onClick={startRecording}
                                            aria-label="mic"
                                            disabled={isListening || isGrading}
                                            sx={{
                                                width: 80, height: 80,
                                                bgcolor: isListening ? 'error.main' : 'primary.main',
                                                color: 'white',
                                                boxShadow: '0 4px 20px rgba(74, 144, 226, 0.4)',
                                                '&:hover': { bgcolor: isListening ? 'error.dark' : 'primary.dark' }
                                            }}
                                        >
                                            <MicIcon fontSize="large" />
                                        </IconButton>
                                    </Zoom>

                                    <IconButton
                                        size="large"
                                        onClick={handleNext}
                                        sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}
                                    >
                                        <NextIcon fontSize="large" />
                                    </IconButton>
                                </Stack>
                            </Stack>

                            {/* Round indicator corner */}
                            <Box sx={{
                                position: 'absolute', top: 0, right: 0, p: 2,
                                bgcolor: 'primary.main', color: 'white',
                                borderBottomLeftRadius: 16, borderTopRightRadius: 24,
                                fontWeight: 'bold'
                            }}>
                                R{round}
                            </Box>
                        </Paper>
                    </motion.div>
                </AnimatePresence>
            </Box>

            {/* Bottom Actions */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Stack direction="row" spacing={2}>
                    <GradientButton
                        startIcon={<SkipIcon />}
                        variant="outlined"
                        onClick={handleNext}
                        sx={{ color: 'text.secondary', borderColor: 'divider' }}
                    >
                        {t('process.skip_btn')}
                    </GradientButton>
                </Stack>
            </Box>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </Container>
    )
}

export default DrillProcessPage
