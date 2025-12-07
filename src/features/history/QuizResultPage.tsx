import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Container,
    Typography,
    Box,
    Paper,
    CircularProgress,
    Button,
    Grid,
    Stack
} from '@mui/material'
import { ArrowBack, Timer, Assignment } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { db, QuizRecord } from '../../services/db'
import QuestionReviewCard, { QuestionData } from './components/QuestionReviewCard'

export default function QuizResultPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useTranslation(['history', 'common'])
    const [record, setRecord] = useState<QuizRecord | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        db.quizRecords.get(Number(id))
            .then(res => setRecord(res || null))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
    }

    if (!record) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h5" color="error">Record not found</Typography>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/history')}>Back</Button>
            </Container>
        )
    }

    // Combine questions from potentially multiple sections (reading/vocabulary)
    // The schema in db.ts says `questions: any`. 
    // Usually it's { reading: [], vocabulary: [] } or legacy { readingQuestions: [], vocabularyQuestions: [] }
    const readingQs = record.questions?.reading || record.questions?.readingQuestions || []
    const vocabQs = record.questions?.vocabulary || record.questions?.vocabularyQuestions || []
    const allQuestions = [...readingQs, ...vocabQs]

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/history')}
                sx={{ mb: 2 }}
            >
                {t('common:back')}
            </Button>

            {/* Header / Summary Card */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                            {t('history:quizResult', 'Quiz Result')}
                        </Typography>
                        <Typography variant="h2" fontWeight="bold">
                            {record.score} <Typography component="span" variant="h5">/ 100</Typography>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Assignment sx={{ opacity: 0.8 }} />
                                <Typography fontWeight="medium">
                                    {allQuestions.length} {t('common:questions', 'Questions')}
                                </Typography>
                            </Box>
                            {record.timeSpent && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Timer sx={{ opacity: 0.8 }} />
                                    <Typography fontWeight="medium">
                                        {Math.floor(record.timeSpent / 60)}m {record.timeSpent % 60}s
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                {t('history:review', 'Review')}
            </Typography>

            {/* Questions List */}
            {allQuestions.map((q: QuestionData, idx: number) => {
                // Find user answer based on ID or index
                // userAnswers structure is usually { reading: { r1: 'A' }, vocabulary: { v1: 'word' } }
                // We need to hunt for it.
                let userAns = null
                if (record.userAnswers?.reading && record.userAnswers.reading[q.id]) {
                    userAns = record.userAnswers.reading[q.id]
                } else if (record.userAnswers?.vocabulary && record.userAnswers.vocabulary[q.id]) {
                    userAns = record.userAnswers.vocabulary[q.id]
                }

                return (
                    <QuestionReviewCard
                        key={idx}
                        question={q}
                        userAnswer={userAns}
                        index={idx}
                    />
                )
            })}
        </Container>
    )
}
