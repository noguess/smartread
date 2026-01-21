import React, { useState } from 'react'
import { Box, Container, Typography, Stack, IconButton, Paper, LinearProgress, Fade, Grid, Chip } from '@mui/material'
import {
    Mic as MicIcon,
    CheckCircle as CheckIcon,
    Cancel as FailIcon,
    School as ExamIcon,
    KeyboardArrowLeft as BackIcon,
    Stars as StarIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Word } from '../../services/db'
import { speechService } from '../../services/speechService'
import { llmService } from '../../services/llmService'
import { settingsService } from '../../services/settingsService'
import { wordService } from '../../services/wordService'
import { SRSAlgorithm } from '../../utils/SRSAlgorithm'
import { GradientButton } from '../../components/common'
import { motion, AnimatePresence } from 'framer-motion'

interface ExamResult {
    word: Word
    readingPassed: boolean
    meaningTranscript: string
    meaningScore?: number
    finalPassed?: boolean
}

const DrillExamPage: React.FC = () => {
    const { t } = useTranslation('drill')
    const navigate = useNavigate()
    const location = useLocation()
    const words = (location.state as { words: Word[] })?.words || []

    const [currentIndex, setCurrentIndex] = useState(0)
    const [subStep, setSubStep] = useState<1 | 2>(1) // 1: Read En, 2: Say Zh
    const [results, setResults] = useState<ExamResult[]>(
        words.map(w => ({ word: w, readingPassed: false, meaningTranscript: '' }))
    )
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [phase, setPhase] = useState<'exam' | 'grading' | 'summary'>('exam')

    const currentWord = words[currentIndex]
    const progress = ((currentIndex) / words.length) * 100

    const startStep1 = () => {
        setTranscript('')
        setIsListening(true)
        speechService.startListening('en-US', (result) => {
            setTranscript(result.transcript)
            if (result.isFinal) {
                setIsListening(false)
                const isCorrect = result.transcript.toLowerCase().includes(currentWord.spelling.toLowerCase())
                if (isCorrect) {
                    const newResults = [...results]
                    newResults[currentIndex].readingPassed = true
                    setResults(newResults)
                    setTimeout(() => {
                        setSubStep(2)
                        setTranscript('')
                    }, 500)
                }
            }
        }, (err) => {
            setIsListening(false)
            console.error(err)
        })
    }

    const startStep2 = () => {
        setTranscript('')
        setIsListening(true)
        speechService.startListening('zh-CN', (result) => {
            setTranscript(result.transcript)
            if (result.isFinal) {
                setIsListening(false)
                const newResults = [...results]
                newResults[currentIndex].meaningTranscript = result.transcript
                setResults(newResults)

                setTimeout(() => {
                    handleNextWord()
                }, 800)
            }
        }, (err) => {
            setIsListening(false)
            console.error(err)
        })
    }

    const handleNextWord = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setSubStep(1)
            setTranscript('')
        } else {
            handleBatchGrading()
        }
    }

    const handleBatchGrading = async () => {
        setPhase('grading')
        try {
            const settings = await settingsService.getSettings()
            const itemsToGrade = results
                .filter(r => r.readingPassed && r.meaningTranscript)
                .map(r => ({ word: r.word.spelling, userInput: r.meaningTranscript }))

            if (itemsToGrade.length > 0) {
                const grades = await llmService.batchGradeTranslations(itemsToGrade, settings)

                const finalResults = results.map(r => {
                    const grade = grades.find(g => g.word === r.word.spelling)
                    const meaningScore = grade ? grade.score : 0
                    const finalPassed = r.readingPassed && meaningScore >= 80
                    return { ...r, meaningScore, finalPassed }
                })
                setResults(finalResults)
                await updateSRS(finalResults)
            } else {
                const finalResults = results.map(r => ({ ...r, finalPassed: false }))
                setResults(finalResults)
                await updateSRS(finalResults)
            }
        } catch (error) {
            console.error('Batch grading failed', error)
        } finally {
            setPhase('summary')
        }
    }

    const updateSRS = async (finalResults: ExamResult[]) => {
        for (const res of finalResults) {
            if (res.word.id) {
                const isCorrect = !!res.finalPassed
                const grade = SRSAlgorithm.mapBooleanToGrade(isCorrect, 'drill')
                const updates = SRSAlgorithm.calculateNextReview(res.word, grade)
                await wordService.updateWord(res.word.id, updates)
            }
        }
    }

    if (phase === 'grading') {
        return (
            <Container maxWidth="sm" sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack spacing={4} alignItems="center">
                    <Box sx={{ animation: 'pulse 1.5s infinite' }}>
                        <ExamIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold">
                        {t('exam.submitting')}
                    </Typography>
                    <LinearProgress sx={{ width: '100%', borderRadius: 4, height: 8 }} />
                </Stack>
            </Container>
        )
    }

    if (phase === 'summary') {
        const passedCount = results.filter(r => r.finalPassed).length
        const isPerfect = passedCount === words.length

        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Paper sx={{ p: 6, borderRadius: 8, textAlign: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <Box sx={{ mb: 4 }}>
                            {isPerfect ? (
                                <StarIcon sx={{ fontSize: 100, color: '#FFD700', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }} />
                            ) : (
                                <ExamIcon sx={{ fontSize: 100, color: 'primary.main' }} />
                            )}
                        </Box>

                        <Typography variant="h3" fontWeight="900" gutterBottom>
                            {isPerfect ? t('exam.exam_perfect') : t('exam.exam_good')}
                        </Typography>

                        <Grid container spacing={4} sx={{ my: 6 }}>
                            <Grid item xs={6}>
                                <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
                                    <Typography variant="overline" color="text.secondary">{t('exam.passed_count')}</Typography>
                                    <Typography variant="h4" fontWeight="bold" color="success.main">{passedCount}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
                                    <Typography variant="overline" color="text.secondary">{t('exam.total_count')}</Typography>
                                    <Typography variant="h4" fontWeight="bold">{words.length}</Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        <Stack spacing={2}>
                            <GradientButton size="large" onClick={() => navigate('/')}>
                                {t('exam.finish_btn')}
                            </GradientButton>
                        </Stack>

                        <Box sx={{ mt: 6, textAlign: 'left' }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">详细反馈</Typography>
                            <Stack spacing={1.5}>
                                {results.map((res, i) => (
                                    <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography fontWeight="bold">{res.word.spelling}</Typography>
                                            <Typography variant="caption" color="text.secondary">{res.word.meaning}</Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                size="small"
                                                icon={res.readingPassed ? <CheckIcon /> : <FailIcon />}
                                                label="读音"
                                                color={res.readingPassed ? "success" : "error"}
                                                variant="outlined"
                                            />
                                            <Chip
                                                size="small"
                                                icon={res.finalPassed ? <CheckIcon /> : <FailIcon />}
                                                label="释义"
                                                color={res.finalPassed ? "success" : "error"}
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>
                    </Paper>
                </motion.div>
            </Container>
        )
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4, height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'action.hover' }}>
                        <BackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">{t('exam.title')}</Typography>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 5 } }}
                />
            </Box>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentIndex}-${subStep}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ width: '100%', maxWidth: 600 }}
                    >
                        <Paper sx={{
                            p: 6,
                            borderRadius: 8,
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                            border: '2px solid',
                            borderColor: isListening ? 'primary.main' : 'divider'
                        }}>
                            <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
                                <Chip
                                    label={subStep === 1 ? t('exam.step_1_title') : t('exam.step_2_title')}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Box>

                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                {subStep === 1 ? t('exam.step_1_desc') : t('exam.step_2_desc')}
                            </Typography>

                            <Typography
                                variant="h1"
                                fontWeight="800"
                                sx={{
                                    my: 4,
                                    color: results[currentIndex].readingPassed && subStep === 2 ? 'success.main' : 'text.primary'
                                }}
                            >
                                {currentWord.spelling}
                            </Typography>

                            <Box sx={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', my: 3 }}>
                                {isListening ? (
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box className="recording-dot" />
                                        <Typography variant="h5" color="text.secondary">
                                            {transcript || (subStep === 1 ? "Listening..." : "请说中文含义...")}
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <IconButton
                                        size="large"
                                        onClick={subStep === 1 ? startStep1 : startStep2}
                                        aria-label="mic"
                                        sx={{
                                            width: 100, height: 100,
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'primary.dark' },
                                            boxShadow: '0 8px 16px rgba(74, 144, 226, 0.3)'
                                        }}
                                    >
                                        <MicIcon sx={{ fontSize: 50 }} />
                                    </IconButton>
                                )}
                            </Box>

                            {results[currentIndex].readingPassed && subStep === 1 && (
                                <Fade in>
                                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ color: 'success.main' }}>
                                        <CheckIcon />
                                        <Typography fontWeight="bold">读音正确，请继续</Typography>
                                    </Stack>
                                </Fade>
                            )}
                        </Paper>
                    </motion.div>
                </AnimatePresence>
            </Box>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .recording-dot {
                    width: 12px;
                    height: 12px;
                    background-color: #f44336;
                    border-radius: 50%;
                    animation: pulse 1s infinite;
                }
            `}</style>
        </Container>
    )
}

export default DrillExamPage
