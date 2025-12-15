import { useState, useEffect } from 'react'
import {
    Paper,
    Typography,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    Box,
    Stepper,
    Step,
    StepLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Card,
    CardContent,
    LinearProgress,
    Stack,
    Divider
} from '@mui/material'
import { ExpandMore, Lightbulb, MenuBook, Abc, EmojiEvents } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { Question } from '../../services/db'
import VocabularyQuestionRenderer from './VocabularyQuestionRenderer'

interface QuizViewProps {
    readingQuestions: Question[]
    vocabularyQuestions: Question[]
    onSubmit: (answers: { reading: Record<string, string>; vocabulary: Record<string, string | string[]> }) => void
    initialAnswers?: {
        reading: Record<string, string>
        vocabulary: Record<string, string | string[]>
    }
    readOnly?: boolean
    onExit?: () => void
    isSubmitting?: boolean
    result?: {
        score: number
        total: number
        message?: string
        stats?: {
            reading: {
                correct: number
                total: number
            }
            vocabulary: {
                correct: number
                total: number
            }
        }
    }
}

export default function QuizView({
    readingQuestions,
    vocabularyQuestions,
    onSubmit,
    initialAnswers,
    readOnly = false,
    onExit,
    isSubmitting = false,
    result,
}: QuizViewProps) {
    const { t } = useTranslation(['reading'])
    const [activeStep, setActiveStep] = useState(0)
    const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>(initialAnswers?.reading || {})
    const [vocabAnswers, setVocabAnswers] = useState<Record<string, string | string[]>>(initialAnswers?.vocabulary || {})

    // Auto-scroll to top when result is displayed (review mode)
    useEffect(() => {
        if (readOnly && result) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    }, [readOnly, result])

    const steps = [t('reading:quiz.readingTitle'), t('reading:quiz.vocabTitle')]

    const handleReadingChange = (questionId: string, value: string) => {
        setReadingAnswers((prev) => ({ ...prev, [questionId]: value }))
    }

    const handleVocabChange = (questionId: string, value: string | string[]) => {
        setVocabAnswers((prev) => ({ ...prev, [questionId]: value }))
    }

    // Check if current step is complete
    const isStepComplete = () => {
        if (activeStep === 0) {
            return readingQuestions.every((q) => readingAnswers[q.id])
        } else {
            return vocabularyQuestions.every((q) => {
                const answer = vocabAnswers[q.id]
                if (Array.isArray(answer)) {
                    // Matching questions - check if all pairs are filled
                    return answer.every((a) => a && a !== '')
                }
                return answer && answer !== ''
            })
        }
    }

    const handleNext = () => {
        setActiveStep(1)
        window.scrollTo(0, 0)
    }



    const handleSubmit = () => {
        onSubmit({
            reading: readingAnswers,
            vocabulary: vocabAnswers,
        })
    }

    return (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4 }}>
            {/* Result Banner in ReadOnly Mode */}
            {/* Result Dashboard in ReadOnly Mode */}
            {readOnly && result && (
                <Card
                    elevation={4}
                    sx={{
                        mb: 4,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', // Soft minimal bg
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}
                >
                    {/* Hero Section */}
                    <Box
                        sx={{
                            p: 3,
                            background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
                            color: 'white',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Decorative Circle */}
                        <Box sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            bgcolor: 'rgba(255,255,255,0.1)'
                        }} />

                        <Stack alignItems="center" spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <EmojiEvents sx={{ fontSize: 40, color: '#FFD700' }} />
                                <Typography variant="h2" fontWeight="800" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                    {result.score}
                                </Typography>
                            </Box>

                            {/* Encouragement Text */}
                            <Typography variant="h6" fontWeight="medium">
                                {result.score >= 80
                                    ? `🎉 ${t('reading:feedback.excellent')}`
                                    : result.score >= 60
                                        ? `👍 ${t('reading:feedback.goodJob')}`
                                        : `💪 ${t('reading:feedback.practice')}`}
                            </Typography>

                            {result.message && (
                                <Typography variant="body2" sx={{ opacity: 0.9, fontStyle: 'italic', bgcolor: 'rgba(0,0,0,0.1)', px: 2, py: 0.5, borderRadius: 2 }}>
                                    {result.message}
                                </Typography>
                            )}
                        </Stack>
                    </Box>

                    {/* Detailed Stats Section */}
                    {result.stats && (
                        <CardContent sx={{ p: 3 }}>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={4}
                                divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
                            >
                                {/* Reading Stats */}
                                <Box sx={{ flex: 1 }}>
                                    <Stack spacing={2}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'white' }}>
                                                <MenuBook fontSize="small" />
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {t('reading:quiz.readingTitle')}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <Typography variant="h4" color="primary.main" fontWeight="bold">
                                                {result.stats.reading.correct} <Typography component="span" variant="h6" color="text.secondary">/ {result.stats.reading.total}</Typography>
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {Math.round((result.stats.reading.correct / (result.stats.reading.total || 1)) * 100)}% Accuracy
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(result.stats.reading.correct / (result.stats.reading.total || 1)) * 100}
                                            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(74, 144, 226, 0.1)', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                                        />
                                    </Stack>
                                </Box>

                                {/* Vocabulary Stats */}
                                <Box sx={{ flex: 1 }}>
                                    <Stack spacing={2}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'secondary.light', color: 'white' }}>
                                                <Abc fontSize="small" />
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {t('reading:quiz.vocabTitle')}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <Typography variant="h4" color="secondary.main" fontWeight="bold">
                                                {result.stats.vocabulary.correct} <Typography component="span" variant="h6" color="text.secondary">/ {result.stats.vocabulary.total}</Typography>
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {Math.round((result.stats.vocabulary.correct / (result.stats.vocabulary.total || 1)) * 100)}% Accuracy
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            color="secondary"
                                            value={(result.stats.vocabulary.correct / (result.stats.vocabulary.total || 1)) * 100}
                                            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(123, 104, 238, 0.1)', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                                        />
                                    </Stack>
                                </Box>
                            </Stack>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Step Content */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {activeStep === 0
                        ? t('reading:quiz.readingTitle')
                        : t('reading:quiz.vocabTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {activeStep === 0
                        ? t('reading:quiz.readingDesc')
                        : t('reading:quiz.vocabDesc')}
                </Typography>
            </Box>

            {/* Questions */}
            {activeStep === 0 ? (
                // Reading Questions - Simple Radio Group
                <>
                    {readingQuestions.map((q, index) => {
                        const userAnswer = readingAnswers[q.id]
                        const isCorrect = userAnswer === q.answer

                        return (
                            <Box key={q.id} sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                    {index + 1}. {q.stem}
                                </Typography>
                                <FormControl fullWidth disabled={readOnly}>
                                    <RadioGroup
                                        name={`reading-question-${q.id}`}
                                        value={userAnswer || ''}
                                        onChange={(e) => handleReadingChange(q.id, e.target.value)}
                                    >
                                        {q.options?.map((opt) => {
                                            const isSelected = userAnswer === opt
                                            const isTheCorrectAnswer = q.answer === opt

                                            let color = 'text.primary'
                                            if (readOnly) {
                                                if (isTheCorrectAnswer) color = 'success.main'
                                                else if (isSelected && !isCorrect) color = 'error.main'
                                            }

                                            return (
                                                <FormControlLabel
                                                    key={opt}
                                                    value={opt}
                                                    control={<Radio color={readOnly ? (isTheCorrectAnswer ? 'success' : isSelected && !isCorrect ? 'error' : 'primary') : 'primary'} />}
                                                    label={
                                                        <Typography color={color} fontWeight={readOnly && isTheCorrectAnswer ? 'bold' : 'normal'}>
                                                            {opt} {readOnly && isTheCorrectAnswer && `(${t('reading:quiz.correct')})`} {readOnly && isSelected && !isCorrect && `(${t('reading:quiz.yourAnswer')})`}
                                                        </Typography>
                                                    }
                                                />
                                            )
                                        })}
                                    </RadioGroup>
                                </FormControl>
                                {readOnly && (
                                    <Accordion elevation={0} sx={{
                                        bgcolor: 'transparent',
                                        '&:before': { display: 'none' },
                                        borderTop: '1px dashed #ccc',
                                        mt: 2
                                    }}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Lightbulb color="info" fontSize="small" />
                                                <Typography variant="button" color="text.secondary">
                                                    {t('reading:quiz.explanation', 'Explanation')}
                                                </Typography>
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography variant="body2" color="text.secondary">
                                                {q.explanation || t('reading:quiz.noExplanation', 'No explanation available.')}
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                )}
                            </Box>
                        )
                    })}
                </>
            ) : (
                // Vocabulary Questions - Using VocabularyQuestionRenderer
                <>
                    {vocabularyQuestions.map((q, index) => {
                        const userAnswer = vocabAnswers[q.id]
                        let isCorrect = false

                        if (Array.isArray(q.answer) && Array.isArray(userAnswer)) {
                            isCorrect = q.answer.length === userAnswer.length &&
                                q.answer.every((val, idx) => val === userAnswer[idx])
                        } else {
                            isCorrect = userAnswer === q.answer
                        }

                        return (
                            <VocabularyQuestionRenderer
                                key={q.id}
                                question={q}
                                answer={userAnswer || (q.type === 'matching' ? [] : '')}
                                onChange={(value) => handleVocabChange(q.id, value)}
                                index={index}
                                readOnly={readOnly}
                                correctAnswer={q.answer}
                                isCorrect={isCorrect}
                            />
                        )
                    })}
                </>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: activeStep === 0 ? 'flex-end' : 'space-between' }}>
                {activeStep > 0 && (
                    <Button variant="outlined" size="large" onClick={() => setActiveStep(0)}>
                        {t('reading:quiz.backToPrevious')}
                    </Button>
                )}

                {activeStep === 0 ? (
                    <Button
                        variant="contained"
                        size="large"
                        disabled={!readOnly && !isStepComplete()}
                        onClick={handleNext}
                    >
                        {t('reading:quiz.next')}
                    </Button>
                ) : (
                    readOnly ? (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={onExit}
                        // Color distinct from Submit? Maybe secondary or warning or error?
                        // Or keep contained primary.
                        >
                            {t('reading:quiz.exitReview', 'Exit Review')}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            size="large"
                            disabled={!isStepComplete() || isSubmitting}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? t('reading:quiz.submitting', 'Submitting...') : t('reading:quiz.submit')}
                        </Button>
                    )
                )}
            </Box>
        </Paper>
    )
}
