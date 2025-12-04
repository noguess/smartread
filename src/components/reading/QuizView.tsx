import { useState } from 'react'
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
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Question } from '../../services/mockLLMService'
import VocabularyQuestionRenderer from './VocabularyQuestionRenderer'

interface QuizViewProps {
    readingQuestions: Question[]
    vocabularyQuestions: Question[]
    onSubmit: (answers: { reading: Record<string, string>; vocabulary: Record<string, string | string[]> }) => void
    onBack: () => void
    initialAnswers?: {
        reading: Record<string, string>
        vocabulary: Record<string, string | string[]>
    }
    readOnly?: boolean
}

export default function QuizView({
    readingQuestions,
    vocabularyQuestions,
    onSubmit,
    onBack,
    initialAnswers,
    readOnly = false
}: QuizViewProps) {
    const { t } = useTranslation(['reading'])
    const [activeStep, setActiveStep] = useState(0)
    const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>(initialAnswers?.reading || {})
    const [vocabAnswers, setVocabAnswers] = useState<Record<string, string | string[]>>(initialAnswers?.vocabulary || {})

    const steps = ['Reading Comprehension', 'Vocabulary Mastery']

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

    const handleBack = () => {
        if (activeStep === 0) {
            onBack()
        } else {
            setActiveStep(0)
        }
    }

    const handleSubmit = () => {
        onSubmit({
            reading: readingAnswers,
            vocabulary: vocabAnswers,
        })
    }

    return (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4 }}>
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
                        ? t('reading:quiz.readingTitle', 'Part 1: Reading Comprehension')
                        : t('reading:quiz.vocabTitle', 'Part 2: Vocabulary Mastery')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {activeStep === 0
                        ? t('reading:quiz.readingDesc', 'Answer the following questions based on the article.')
                        : t('reading:quiz.vocabDesc', 'Test your mastery of the core words.')}
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
                                                    control={<Radio color={readOnly && isTheCorrectAnswer ? 'success' : isSelected && !isCorrect ? 'error' : 'primary'} />}
                                                    label={
                                                        <Typography color={color} fontWeight={readOnly && isTheCorrectAnswer ? 'bold' : 'normal'}>
                                                            {opt} {readOnly && isTheCorrectAnswer && '(Correct)'} {readOnly && isSelected && !isCorrect && '(Your Answer)'}
                                                        </Typography>
                                                    }
                                                />
                                            )
                                        })}
                                    </RadioGroup>
                                </FormControl>
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
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" size="large" onClick={handleBack}>
                    {t('reading:quiz.back')}
                </Button>
                {activeStep === 0 ? (
                    <Button
                        variant="contained"
                        size="large"
                        disabled={!readOnly && !isStepComplete()}
                        onClick={handleNext}
                    >
                        {t('reading:quiz.next', 'Next Part')}
                    </Button>
                ) : (
                    !readOnly && (
                        <Button
                            variant="contained"
                            size="large"
                            disabled={!isStepComplete()}
                            onClick={handleSubmit}
                        >
                            {t('reading:quiz.submit')}
                        </Button>
                    )
                )}
            </Box>
        </Paper>
    )
}
