import { useState } from 'react'
import { Paper, Typography, Box, Rating, Button } from '@mui/material'
import { CheckCircle, Cancel } from '@mui/icons-material'

interface ScoreFeedbackProps {
    score: number
    totalQuestions: number
    onComplete: (difficulty: number) => void
}

export default function ScoreFeedback({ score, totalQuestions, onComplete }: ScoreFeedbackProps) {
    const [difficulty, setDifficulty] = useState<number | null>(null)
    const percentage = Math.round((score / totalQuestions) * 100)

    return (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 4, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
            <Box sx={{ mb: 3 }}>
                {percentage >= 60 ? (
                    <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
                ) : (
                    <Cancel sx={{ fontSize: 80, color: 'warning.main' }} />
                )}
            </Box>

            <Typography variant="h3" fontWeight="bold" gutterBottom>
                {percentage}%
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                You got {score} out of {totalQuestions} correct!
            </Typography>

            <Box sx={{ my: 4, py: 3, borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                <Typography gutterBottom>How difficult was this article?</Typography>
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
                Finish Learning
            </Button>
        </Paper>
    )
}
