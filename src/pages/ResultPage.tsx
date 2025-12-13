import { useEffect } from 'react'
import {
    Box,
    Typography,
    Paper,
    Grid,
    Stack,
    Button,
    Divider,
    Container
} from '@mui/material'
import {
    EmojiEvents,
    MenuBook,
    Abc,
    ArrowBack,
    RestartAlt,
    List as ListIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { QuizRecord } from '../services/db'
import QuestionReviewCard from '../features/history/components/QuestionReviewCard'
import { motion } from 'framer-motion'

interface ResultPageProps {
    result: QuizRecord
    onBackToArticle: () => void
    onRetry: () => void
}

export default function ResultPage({ result, onBackToArticle, onRetry }: ResultPageProps) {
    const { t } = useTranslation(['reading', 'common', 'history'])

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    // Calculate stats
    const readingQs = (result.questions as any)?.reading || []
    const vocabQs = (result.questions as any)?.vocabulary || []
    const allQuestions = [...readingQs, ...vocabQs]

    const readingCorrect = readingQs.filter((q: any) =>
        result.userAnswers?.reading?.[q.id] === q.answer
    ).length

    // Vocab correct count logic (handling array answers for matching)
    // Simplified specific logic for display stats
    const vocabCorrect = vocabQs.filter((q: any) => {
        const ans = result.userAnswers?.vocabulary?.[q.id]
        if (Array.isArray(q.answer) && Array.isArray(ans)) {
            return q.answer.length === ans.length && q.answer.every((v: string, i: number) => v === ans[i])
        }
        return ans === q.answer
    }).length

    const totalScore = result.score || 0
    // const isPass = totalScore >= 60

    return (
        <Container maxWidth="md" disableGutters sx={{ py: 4 }}>

            {/* Score Card */}
            <Paper
                elevation={0}
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                sx={{
                    p: 0,
                    borderRadius: 6,
                    overflow: 'hidden',
                    mb: 5,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.08)'
                }}
            >
                {/* Hero Header */}
                <Box
                    sx={{
                        background: totalScore >= 60
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' // Emerald
                            : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Amber
                        color: 'white',
                        p: 4,
                        textAlign: 'center',
                        position: 'relative'
                    }}
                >
                    <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1 }}>
                        {t('reading:quiz.resultTitle', 'Quiz Result')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, my: 2 }}>
                        <EmojiEvents sx={{ fontSize: 48, color: '#FFD700', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                        <Typography variant="h1" fontWeight="800" sx={{ fontSize: '4rem', lineHeight: 1 }}>
                            {totalScore}
                        </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="medium" sx={{ opacity: 0.9 }}>
                        {totalScore >= 80
                            ? t('reading:feedback.excellent', 'Excellent Work!')
                            : totalScore >= 60
                                ? t('reading:feedback.goodJob', 'Good Job!')
                                : t('reading:feedback.practice', 'Keep Practicing!')}
                    </Typography>
                </Box>

                {/* Stats Grid */}
                <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
                                    <MenuBook fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight="bold">{t('reading:quiz.readingTitle')}</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="700">
                                    {readingCorrect}<span style={{ fontSize: '1rem', color: '#999', fontWeight: 400 }}>/{readingQs.length}</span>
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1, color: 'secondary.main' }}>
                                    <Abc fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight="bold">{t('reading:quiz.vocabTitle')}</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="700">
                                    {vocabCorrect}<span style={{ fontSize: '1rem', color: '#999', fontWeight: 400 }}>/{vocabQs.length}</span>
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* Actions */}
                <Divider />
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', bgcolor: 'action.hover' }}>
                    <Button
                        startIcon={<RestartAlt />}
                        onClick={onRetry}
                        color="inherit"
                    >
                        {t('reading:quiz.retry', 'Retry Quiz')}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<ArrowBack />}
                        onClick={onBackToArticle}
                        sx={{ borderRadius: 4, px: 3 }}
                    >
                        {t('reading:quiz.backToArticle', 'Back to Article')}
                    </Button>
                </Box>
            </Paper>

            {/* Detailed Review */}
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ListIcon color="action" />
                {t('history:review', 'Detailed Review')}
            </Typography>

            <Stack spacing={3}>
                {allQuestions.map((q: any, idx: number) => {
                    let userAns = null
                    if (result.userAnswers?.reading && result.userAnswers.reading[q.id]) {
                        userAns = result.userAnswers.reading[q.id]
                    } else if (result.userAnswers?.vocabulary && result.userAnswers.vocabulary[q.id]) {
                        userAns = result.userAnswers.vocabulary[q.id]
                    }

                    return (
                        <QuestionReviewCard
                            key={q.id || idx}
                            question={q}
                            userAnswer={userAns}
                            index={idx}
                        />
                    )
                })}
            </Stack>
        </Container>
    )
}
