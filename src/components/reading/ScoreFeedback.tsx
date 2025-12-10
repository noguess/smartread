import { useState } from 'react'
import { Paper, Typography, Box, Rating, Button } from '@mui/material'
import { CheckCircle, Cancel } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import ConfettiEffect from '../common/ConfettiEffect'

interface ScoreFeedbackProps {
    score: number
    totalQuestions: number
    customPercentage?: number // Optional weighted percentage
    onComplete: (difficulty: number) => void
    onReview?: () => void
}

export default function ScoreFeedback({ score, totalQuestions, customPercentage, onComplete, onReview }: ScoreFeedbackProps) {
    const { t } = useTranslation(['reading'])
    const [difficulty, setDifficulty] = useState<number | null>(null)
    const percentage = customPercentage !== undefined
        ? customPercentage
        : Math.round((score / totalQuestions) * 100)

    return (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 4, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
            <ConfettiEffect trigger={percentage >= 90} />
            <Box sx={{ mb: 3 }}>
                {percentage >= 60 ? (
                    <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
                ) : (
                    <Cancel sx={{ fontSize: 80, color: 'warning.main' }} />
                )}
            </Box>

            <Typography variant="h3" fontWeight="bold" gutterBottom>
                {percentage}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('reading:feedback.scoreDesc', { score, total: totalQuestions })}
            </Typography>

            <Box sx={{ my: 4, py: 3, borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                <Typography gutterBottom>{t('reading:feedback.difficulty')}</Typography>
                <Rating
                    name="difficulty"
                    value={difficulty}
                    onChange={(_, newValue) => setDifficulty(newValue)}
                    size="large"
                />
            </Box>

            <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={difficulty === null}
                onClick={() => onComplete(difficulty!)}
            >
                {t('reading:feedback.complete')}
            </Button>

            {onReview && (
                <Button
                    variant="text"
                    fullWidth
                    onClick={onReview}
                    sx={{ mt: 2, color: 'text.secondary' }}
                >
                    {t('reading:feedback.reviewAnswers', 'Review Answers & Explanations')}
                </Button>
            )}
        </Paper>
    )
}
