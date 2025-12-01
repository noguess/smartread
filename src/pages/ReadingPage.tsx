import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Container, Box, CircularProgress, Typography, Button, Grid, Paper, Chip } from '@mui/material'
import { Word, History } from '../services/db'
import { mockLLMService, GeneratedContent } from '../services/mockLLMService'
import { llmService } from '../services/llmService'
import { settingsService } from '../services/settingsService'
import { SRSAlgorithm } from '../utils/SRSAlgorithm'
import { wordService } from '../services/wordService'
import { historyService } from '../services/historyService'
import ArticleContent from '../components/reading/ArticleContent'
import QuizView from '../components/reading/QuizView'
import ScoreFeedback from '../components/reading/ScoreFeedback'
import WordDetailModal from '../components/WordDetailModal'
import ReadingProgressBar from '../components/reading/ReadingProgressBar'
import ReadingToolbar from '../components/reading/ReadingToolbar'
import ReadingTimer from '../components/reading/ReadingTimer'
import { useTranslation } from 'react-i18next'

type Step = 'generating' | 'reading' | 'quiz' | 'feedback'
type FontSize = 'small' | 'medium' | 'large'

export default function ReadingPage() {
    const { t } = useTranslation(['reading'])
    const location = useLocation()
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>('generating')
    const [fontSize, setFontSize] = useState<FontSize>(() => {
        return (localStorage.getItem('reading_font_size') as FontSize) || 'medium'
    })
    const [articleData, setArticleData] = useState<GeneratedContent | null>(null)
    const [targetWords, setTargetWords] = useState<Word[]>([])
    const [score, setScore] = useState(0)
    const [selectedWord, setSelectedWord] = useState<string>('')
    const [isWordModalOpen, setIsWordModalOpen] = useState(false)

    const [isReviewMode, setIsReviewMode] = useState(false)

    useEffect(() => {
        const state = location.state as any

        if (state?.mode === 'review' && state?.historyRecord) {
            // Review Mode
            const record = state.historyRecord as History
            setIsReviewMode(true)
            loadReviewContent(record)
        } else if (state?.words && state.words.length > 0) {
            // Generation Mode
            setTargetWords(state.words)
            generateContent(state.words)
        } else {
            // Fallback
            navigate('/')
        }
    }, [location.state, navigate])

    const loadReviewContent = async (record: History) => {
        try {
            // Reconstruct article data
            const data: GeneratedContent = {
                title: record.title || ('Review: ' + new Date(record.date).toLocaleDateString()),
                content: record.articleContent,
                questions: record.questionsJson,
            }
            setArticleData(data)

            // Fetch full word objects
            const words = await Promise.all(
                record.targetWords.map(spelling => wordService.getWordBySpelling(spelling))
            )
            setTargetWords(words.filter((w): w is Word => !!w))

            setStep('reading')
        } catch (error) {
            console.error('Failed to load review', error)
            navigate('/history')
        }
    }

    const generateContent = async (words: Word[]) => {
        try {
            setStep('generating')

            // Check Settings
            const settings = await settingsService.getSettings()

            let data: GeneratedContent
            if (settings && settings.apiKey) {
                // Use Real API
                data = await llmService.generateArticle(words, settings)
            } else {
                // Fallback to Mock
                console.warn('No API Key found. Using Mock Service.')
                data = await mockLLMService.generateArticle(words)
            }

            setArticleData(data)
            setStep('reading')
        } catch (error) {
            console.error('Generation failed', error)
            alert(t('reading:error.generationFailed', { error: error instanceof Error ? error.message : 'Unknown error' }))
            navigate('/')
        }
    }

    const handleQuizSubmit = async (answers: Record<string, string>) => {
        if (!articleData) return

        // Calculate Score
        let correctCount = 0
        articleData.questions.forEach(q => {
            if (answers[q.id] === q.answer) {
                correctCount++
            }
        })
        setScore(correctCount)
        setStep('feedback')

        // Update SRS for each target word
        // Logic: If score is high (>80%), treat all words as 'Correct'? 
        // Or just update repetition count?
        // PRD 2.2 says: "Feedback from quiz updates word status".
        // For simplicity: If quiz passed (>60%), mark words as Correct. Else Incorrect.
        const passed = (correctCount / articleData.questions.length) >= 0.6

        for (const word of targetWords) {
            const updates = SRSAlgorithm.calculateNextReview(word, passed)
            await wordService.updateWord(word.id!, updates)
        }
    }

    const handleFinish = async (difficulty: number) => {
        if (!articleData) return

        // Save History
        const historyRecord: Omit<History, 'id'> = {
            date: Date.now(),
            title: articleData.title,
            articleContent: articleData.content,
            targetWords: targetWords.map(w => w.spelling),
            questionsJson: articleData.questions,
            userScore: Math.round((score / articleData.questions.length) * 100),
            difficultyFeedback: difficulty
        }

        await historyService.saveArticleRecord(historyRecord)
        navigate('/')
    }

    const handleWordClick = (word: string) => {
        setSelectedWord(word)
        setIsWordModalOpen(true)
    }

    const handleFontSizeChange = (newSize: FontSize) => {
        setFontSize(newSize)
        localStorage.setItem('reading_font_size', newSize)
    }

    if (step === 'generating') {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <CircularProgress size={60} thickness={4} sx={{ mb: 4 }} />
                <Typography variant="h5" color="text.secondary">
                    {t('reading:generating.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    {t('reading:generating.subtitle', { count: targetWords.length })}
                </Typography>
            </Box>
        )
    }

    return (
        <>
            {step === 'reading' && <ReadingProgressBar />}

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {step === 'reading' && articleData && (
                    <Grid container spacing={3}>
                        {/* Left Sidebar - Info Panel (Desktop only) */}
                        <Grid item xs={12} lg={2} sx={{ display: { xs: 'none', lg: 'block' } }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Reading Timer */}
                                <ReadingTimer />

                                {/* Info Panel */}
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        position: 'sticky',
                                        top: 80
                                    }}
                                >
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        {t('reading:sidebar.difficulty')}
                                    </Typography>
                                    <Chip
                                        label={t('reading:sidebar.intermediate')}
                                        size="small"
                                        color="primary"
                                        sx={{ mb: 2 }}
                                    />

                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                                        {t('reading:sidebar.targetWords')}
                                    </Typography>
                                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                                        {targetWords.length}
                                    </Typography>
                                </Paper>
                            </Box>
                        </Grid>

                        {/* Center - Article Content */}
                        <Grid item xs={12} lg={8}>
                            <ArticleContent
                                title={articleData.title}
                                content={articleData.content}
                                onWordClick={handleWordClick}
                                fontSize={fontSize}
                            />

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => setStep('quiz')}
                                    sx={{
                                        px: 6,
                                        py: 1.5,
                                        borderRadius: 8,
                                        fontSize: '1.2rem',
                                        background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
                                        boxShadow: '0 4px 20px rgba(74, 144, 226, 0.3)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            transform: 'scale(1.02)',
                                            boxShadow: '0 6px 24px rgba(74, 144, 226, 0.4)'
                                        }
                                    }}
                                >
                                    {isReviewMode ? t('reading:buttons.reviewQuiz') : t('reading:buttons.startQuiz')}
                                </Button>
                            </Box>
                        </Grid>

                        {/* Right Toolbar */}
                        <Grid item xs={12} lg={2} sx={{ display: { xs: 'none', lg: 'block' } }}>
                            <ReadingToolbar
                                onFontSizeChange={handleFontSizeChange}
                                currentFontSize={fontSize}
                            />
                        </Grid>

                        {/* Mobile Font Size Control */}
                        <Grid item xs={12} sx={{ display: { xs: 'block', lg: 'none' } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <ReadingToolbar
                                    onFontSizeChange={handleFontSizeChange}
                                    currentFontSize={fontSize}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                )}

                {step === 'quiz' && articleData && (
                    <QuizView
                        questions={articleData.questions}
                        onSubmit={handleQuizSubmit}
                        onBack={() => setStep('reading')}
                    />
                )}

                {step === 'feedback' && articleData && (
                    <ScoreFeedback
                        score={score}
                        totalQuestions={articleData.questions.length}
                        onComplete={handleFinish}
                    />
                )}

                <WordDetailModal
                    word={selectedWord}
                    open={isWordModalOpen}
                    onClose={() => setIsWordModalOpen(false)}
                />
            </Container>
        </>
    )
}
