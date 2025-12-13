import {
    Paper,
    Typography,
    Box,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack
} from '@mui/material'
import { ExpandMore, Lightbulb } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

export interface QuestionData {
    id: string
    type: string
    stem: string
    options?: string[]
    answer: string
    explanation?: string
}

interface QuestionReviewCardProps {
    question: QuestionData
    userAnswer: any
    index: number
}

// Helper to determine if answer is correct ignoring case/whitespace
const isCorrect = (user: any, correct: string | string[]) => {
    if (!user) return false
    // Handle arrays (e.g. Matching questions)
    if (Array.isArray(correct) && Array.isArray(user)) {
        return JSON.stringify(correct.sort()) === JSON.stringify(user.sort())
    }
    return String(user).trim().toLowerCase() === String(correct).trim().toLowerCase()
}

export default function QuestionReviewCard({ question, userAnswer, index }: QuestionReviewCardProps) {
    const { t } = useTranslation(['common'])
    const correct = isCorrect(userAnswer, question.answer)

    return (
        <Paper elevation={0} sx={{
            p: 3,
            mb: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: correct ? 'success.light' : 'error.light',
            bgcolor: correct ? 'success.50' : 'error.50' // Mui alpha colors might not work without theme config, using standard fallback
        }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                <Chip
                    label={`Q${index + 1}`}
                    color={correct ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                />
                <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        {question.stem}
                    </Typography>

                    {/* Options Display (if applicable) */}
                    {question.options && question.options.length > 0 && (
                        <Stack spacing={1} sx={{ mt: 1, ml: 1 }}>
                            {question.options.map((opt, i) => {
                                const isSelected = userAnswer === opt
                                const isRightAnswer = question.answer === opt
                                let color = 'text.primary'
                                let fontWeight = 'normal'

                                if (isSelected && isRightAnswer) {
                                    color = 'success.main'
                                    fontWeight = 'bold'
                                } else if (isSelected && !isRightAnswer) {
                                    color = 'error.main'
                                    fontWeight = 'bold'
                                } else if (isRightAnswer) {
                                    color = 'success.main'
                                    fontWeight = 'bold'
                                }

                                return (
                                    <Typography key={i} variant="body2" color={color} sx={{ fontWeight }}>
                                        {String.fromCharCode(65 + i)}. {opt}
                                        {isSelected && " (Your Answer)"}
                                        {isRightAnswer && !isSelected && " (Correct Answer)"}
                                    </Typography>
                                )
                            })}
                        </Stack>
                    )}

                    {/* Text Input Display (if no options) */}
                    {(!question.options || question.options.length === 0) && (
                        <Box sx={{ mt: 1, ml: 1 }}>
                            <Typography variant="body2" color={correct ? 'success.main' : 'error.main'} fontWeight="bold">
                                Your Answer: {Array.isArray(userAnswer) ? userAnswer.join(', ') : (userAnswer || '(No Answer)')}
                            </Typography>
                            {!correct && (
                                <Typography variant="body2" color="success.main" fontWeight="bold">
                                    Correct Answer: {Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            </Stack>

            {/* Explanation Section */}
            <Accordion elevation={0} sx={{
                bgcolor: 'transparent',
                '&:before': { display: 'none' },
                borderTop: '1px dashed #ccc'
            }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Lightbulb color="info" fontSize="small" />
                        <Typography variant="button" color="text.secondary">
                            {t('common:explanation', 'Explanation')}
                        </Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                        {question.explanation || t('common:noExplanation', 'No explanation available.')}
                    </Typography>
                </AccordionDetails>
            </Accordion>
        </Paper>
    )
}
