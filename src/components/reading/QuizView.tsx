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
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Question } from '../../services/mockLLMService'

interface QuizViewProps {
    questions: Question[]
    onSubmit: (answers: Record<string, string>) => void
    onBack: () => void
}

export default function QuizView({ questions, onSubmit, onBack }: QuizViewProps) {
    const { t } = useTranslation(['reading'])
    const [answers, setAnswers] = useState<Record<string, string>>({})

    const handleChange = (questionId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }))
    }

    const isComplete = questions.every((q) => answers[q.id])

    return (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                {t('reading:quiz.title')}
            </Typography>

            {questions.map((q, index) => (
                <Box key={q.id} sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        {index + 1}. {q.stem}
                    </Typography>
                    <FormControl>
                        <RadioGroup
                            value={answers[q.id] || ''}
                            onChange={(e) => handleChange(q.id, e.target.value)}
                        >
                            {q.options.map((opt) => (
                                <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
                            ))}
                        </RadioGroup>
                    </FormControl>
                </Box>
            ))}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    size="large"
                    onClick={onBack}
                >
                    {t('reading:quiz.back')}
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    disabled={!isComplete}
                    onClick={() => onSubmit(answers)}
                >
                    {t('reading:quiz.submit')}
                </Button>
            </Box>
        </Paper>
    )
}
