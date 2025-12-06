import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Container, Box, Typography, Button, Grid, Paper, Chip, Fade, Divider } from '@mui/material'

import { Word, History, Article, QuizRecord } from '../services/db'
import { mockLLMService, GeneratedContent } from '../services/mockLLMService'
import { llmService } from '../services/llmService'
import { settingsService } from '../services/settingsService'
import { SRSAlgorithm } from '../utils/SRSAlgorithm'
import { wordService } from '../services/wordService'
import { historyService } from '../services/historyService'
import { articleService } from '../services/articleService'
import { quizRecordService } from '../services/quizRecordService'
import ArticleContent from '../components/reading/ArticleContent'
import QuizView from '../components/reading/QuizView'
import ScoreFeedback from '../components/reading/ScoreFeedback'
import WordDetailModal from '../components/WordDetailModal'
import ReadingProgressBar from '../components/reading/ReadingProgressBar'
import ReadingToolbar from '../components/reading/ReadingToolbar'
import ReadingTimer from '../components/reading/ReadingTimer'
import GenerationLoading from '../components/reading/GenerationLoading'
import { useTranslation } from 'react-i18next'
import { useStudyTimer } from '../hooks/useStudyTimer'

type Step = 'generating' | 'reading' | 'quiz' | 'feedback'
type FontSize = 'small' | 'medium' | 'large'

export default function ReadingPage() {
    const { t } = useTranslation(['reading'])
    const { id } = useParams<{ id: string }>()
    const location = useLocation()
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>('generating')
    const [fontSize, setFontSize] = useState<FontSize>(() => {
        return (localStorage.getItem('reading_font_size') as FontSize) || 'medium'
    })
    const [articleData, setArticleData] = useState<GeneratedContent | null>(null)
    const [targetWords, setTargetWords] = useState<Word[]>([])
    const [score, setScore] = useState(0)
    const [readingScore, setReadingScore] = useState(0)
    const [selectedWord, setSelectedWord] = useState<string>('')
    const [isWordModalOpen, setIsWordModalOpen] = useState(false)
    const [lastWordResults, setLastWordResults] = useState<{ [spelling: string]: boolean }>({})
    const [quizAnswers, setQuizAnswers] = useState<{
        reading: Record<string, string>
        vocabulary: Record<string, string | string[]>
    } | null>(null)

    const [isReviewMode, setIsReviewMode] = useState(false)
    const [viewMode, setViewMode] = useState<'results' | 'retake' | null>(null)

    const [error, setError] = useState<string | null>(null)
    const [realProgress, setRealProgress] = useState(0)

    // New state for V2.0 support
    const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
    const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([])
    const [isLoadingArticle, setIsLoadingArticle] = useState(false)

    // Study Timer
    const { timeSpent, start: startTimer, pause: pauseTimer } = useStudyTimer(false)

    useEffect(() => {
        if (step === 'reading' || step === 'quiz') {
            startTimer()
        } else {
            pauseTimer()
        }
    }, [step, startTimer, pauseTimer])

    useEffect(() => {
        const state = location.state as any
        console.log('🔍 ReadingPage useEffect triggered')
        console.log('📍 URL id:', id)
        console.log('📦 Navigation state:', state)

        // Priority 1: Generation Mode (V2.0 new flow - generate on this page)
        if (state?.mode === 'generate' && state?.words && state?.settings) {
            console.log('✅ Detected generation mode - will generate on this page')
            setTargetWords(state.words)
            generateAndSaveNewArticle(state.words, state.settings)
        }
        // Priority 2: Load from URL parameter (V2.0 behavior - existing article)
        else if (id) {
            console.log('✅ Detected article ID - will load existing article:', id)
            loadArticleById(Number(id))
        }
        // Priority 3: Review Mode (legacy)
        else if (state?.mode === 'review' && state?.historyRecord) {
            console.log('✅ Detected review mode')
            const record = state.historyRecord as History
            setIsReviewMode(true)
            loadReviewContent(record)
        }
        // Priority 4: Generation Mode (legacy - direct word passing)
        else if (state?.words && state.words.length > 0) {
            console.log('✅ Detected legacy generation mode')
            setTargetWords(state.words)
            generateContent(state.words)
        }
        // Fallback: Navigate to home ONLY if we're not already in a loading state
        else if (step !== 'generating') {
            console.log('⚠️ No valid state detected - navigating to home')
            navigate('/')
        }
    }, [id, location.state]) // Removed 'navigate' and 'step' from dependencies

    const loadArticleById = async (articleId: number) => {
        try {
            setIsLoadingArticle(true)
            setError(null)
            setStep('generating') // Show loading state
            console.log('Loading article by ID:', articleId)

            // Fetch article
            const article = await articleService.getById(articleId)
            if (!article) {
                throw new Error(`Article ${articleId} not found`)
            }

            console.log('Article loaded:', article)
            setCurrentArticle(article)

            // Set article data for display (no quiz questions yet)
            setArticleData({
                title: article.title,
                content: article.content,
                readingQuestions: [],
                vocabularyQuestions: []
            })

            // Load target words
            const words = await Promise.all(
                article.targetWords.map(spelling => wordService.getWordBySpelling(spelling))
            )
            setTargetWords(words.filter((w): w is Word => !!w))

            // Load quiz history for this article
            const history = await quizRecordService.getRecordsByArticleUuid(article.uuid)
            setQuizHistory(history)
            console.log('Quiz history loaded:', history.length, 'records')

            setStep('reading')
        } catch (error) {
            console.error('Failed to load article', error)
            setError(error instanceof Error ? error.message : 'Failed to load article')
        } finally {
            setIsLoadingArticle(false)
        }
    }

    const loadReviewContent = async (record: History) => {
        try {
            // Reconstruct article data
            const data: GeneratedContent = {
                title: record.title || ('Review: ' + new Date(record.date).toLocaleDateString()),
                content: record.articleContent,
                readingQuestions: record.questionsJson?.reading || [],
                vocabularyQuestions: record.questionsJson?.vocabulary || [],
            }
            setArticleData(data)

            if (record.userAnswers) {
                setQuizAnswers(record.userAnswers)
            }

            // Fetch full word objects
            const words = await Promise.all(
                record.targetWords.map(spelling => wordService.getWordBySpelling(spelling))
            )
            setTargetWords(words.filter((w): w is Word => !!w))

            // Reset viewMode when loading new review content
            setViewMode(null)
            setStep('reading')
        } catch (error) {
            console.error('Failed to load review', error)
            navigate('/history')
        }
    }

    const generateAndSaveNewArticle = async (words: Word[], settings: any) => {
        try {
            setStep('generating')
            setError(null)
            setRealProgress(0)
            console.log('Starting V2.0 article generation for words:', words.map(w => w.spelling))

            // Call generateArticleOnly (no quiz generation)
            const articleData = settings.apiKey
                ? await llmService.generateArticleOnly(words, settings, (progress) => {
                    console.log('📊 Real API Download progress:', progress + '%')
                    setRealProgress(progress)
                })
                : await mockLLMService.generateArticleOnly(words, settings, (progress) => {
                    console.log('🎭 Mock progress:', progress + '%')
                    setRealProgress(progress)
                })

            console.log('Article generation successful:', articleData)

            // Save to database
            const { v4: uuidv4 } = await import('uuid')
            const article = {
                uuid: uuidv4(),
                title: articleData.title,
                content: articleData.content,
                targetWords: articleData.targetWords,
                difficultyLevel: settings.difficultyLevel || 'L2',
                source: 'generated' as const
            }

            const articleId = await articleService.add(article)
            console.log('Article saved to database with ID:', articleId)

            // Set current article and article data for display
            setCurrentArticle({ ...article, id: articleId, createdAt: Date.now() })
            setArticleData({
                title: articleData.title,
                content: articleData.content,
                readingQuestions: [],
                vocabularyQuestions: []
            })

            // Update URL without navigation (optional - keeps clean URL)
            window.history.replaceState({}, '', `/read/${articleId}`)

            setStep('reading')
        } catch (error) {
            console.error('Failed to generate and save article:', error)
            setError(error instanceof Error ? error.message : 'Failed to generate article')
        }
    }


    const generateContent = async (words: Word[]) => {
        try {
            setStep('generating')
            setError(null)
            setRealProgress(0) // Reset progress
            console.log('Starting content generation for words:', words.map(w => w.spelling))

            // Check Settings
            const settings = await settingsService.getSettings()
            console.log('Using settings:', settings)

            let data: GeneratedContent
            if (settings && settings.apiKey) {
                // Use Real API with progress callback
                console.log('Calling Real LLM Service...')
                data = await llmService.generateArticle(
                    words,
                    settings,
                    (progress) => {
                        console.log('📊 Real API Download progress:', progress + '%')
                        setRealProgress(progress)
                    }
                )
            } else {
                // Fallback to Mock with progress callback
                console.warn('No API Key found. Using Mock Service.')
                data = await mockLLMService.generateArticle(
                    words,
                    settings,
                    (progress) => {
                        console.log('🎭 Mock progress:', progress + '%')
                        setRealProgress(progress)
                    }
                )
            }

            console.log('Generation successful:', data)
            setArticleData(data)
            setStep('reading')
        } catch (error) {
            console.error('Generation failed', error)
            setError(error instanceof Error ? error.message : 'Unknown error occurred')
            // Do not navigate away, let user see error and retry
        }
    }

    const handleRetry = () => {
        generateContent(targetWords)
    }

    const handleQuizSubmit = async (answers: { reading: Record<string, string>; vocabulary: Record<string, string | string[]> }) => {
        if (!articleData) return

        setQuizAnswers(answers)

        // Calculate Reading Score (40% weight)
        let readingCorrect = 0
        articleData.readingQuestions.forEach(q => {
            if (answers.reading[q.id] === q.answer) {
                readingCorrect++
            }
        })

        // Calculate Vocabulary Score (60% weight)
        let vocabCorrect = 0
        articleData.vocabularyQuestions.forEach(q => {
            const userAnswer = answers.vocabulary[q.id]
            const correctAnswer = q.answer

            let isCorrect = false
            if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
                // Array comparison for matching questions
                isCorrect = correctAnswer.length === userAnswer.length &&
                    correctAnswer.every((val, index) => val === userAnswer[index])
            } else {
                // Simple string comparison
                isCorrect = userAnswer === correctAnswer
            }

            if (isCorrect) {
                vocabCorrect++
            }
        })

        const totalCorrect = readingCorrect + vocabCorrect
        setScore(totalCorrect)
        setReadingScore(readingCorrect)
        setStep('feedback')

        // Precise SRS Update Logic
        const wordResults: { [spelling: string]: boolean } = {}

        for (const q of articleData.vocabularyQuestions) {
            // Find the target word object
            const word = targetWords.find(w => w.spelling === q.targetWord) ||
                targetWords.find(w => q.stem.includes(w.spelling)) // Fallback matching

            if (word && word.id) {
                const userAnswer = answers.vocabulary[q.id]
                const correctAnswer = q.answer

                let isCorrect = false
                if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
                    isCorrect = correctAnswer.length === userAnswer.length &&
                        correctAnswer.every((val, index) => val === userAnswer[index])
                } else {
                    isCorrect = userAnswer === correctAnswer
                }

                wordResults[word.spelling] = isCorrect

                // Update SRS based on specific question result
                const updates = SRSAlgorithm.calculateNextReview(word, isCorrect)
                await wordService.updateWord(word.id, updates)
            }
        }

        // Store word results for history saving
        setLastWordResults(wordResults)
    }

    const handleFinish = async (difficulty: number) => {
        if (!articleData) return

        // Save History
        const historyRecord: Omit<History, 'id'> = {
            date: Date.now(),
            title: articleData.title,
            articleContent: articleData.content,
            targetWords: targetWords.map(w => w.spelling),
            questionsJson: {
                reading: articleData.readingQuestions,
                vocabulary: articleData.vocabularyQuestions
            },
            userScore: Math.round((score / (articleData.readingQuestions.length + articleData.vocabularyQuestions.length)) * 100),
            difficultyFeedback: difficulty,
            timeSpent: timeSpent,
            wordResults: lastWordResults,
            userAnswers: quizAnswers || undefined
        }

        await historyService.saveArticleRecord(historyRecord)

        // Auto-adjustment Logic
        const settings = await settingsService.getSettings()
        const currentLevel = settings?.difficultyLevel || 'L2'
        let newLevel = currentLevel
        let message = ''

        // Upgrade Condition: Reading 4/4 correct AND Feedback <= 2 (Easy)
        if (readingScore === 4 && difficulty <= 2) {
            if (currentLevel === 'L1') newLevel = 'L2'
            else if (currentLevel === 'L2') newLevel = 'L3'
        }
        // Downgrade Condition: Reading < 2 correct AND Feedback = 5 (Too Hard)
        else if (readingScore < 2 && difficulty === 5) {
            if (currentLevel === 'L3') newLevel = 'L2'
            else if (currentLevel === 'L2') newLevel = 'L1'
        }

        if (newLevel !== currentLevel) {
            await settingsService.saveSettings({ difficultyLevel: newLevel })
            message = t('reading:difficultyChanged', `Difficulty adjusted to ${newLevel}`, { level: newLevel })
        }

        navigate('/', { state: { message } })
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
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {error ? (
                        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fff5f5', border: '1px solid #ffcdd2' }}>
                            <Typography variant="h6" color="error" gutterBottom>
                                {t('reading:error.generationFailed', 'Generation Failed')}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                {error}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button variant="outlined" onClick={() => navigate('/')}>
                                    {t('common:button.back', 'Back')}
                                </Button>
                                <Button variant="contained" onClick={handleRetry}>
                                    {t('common:button.retry', 'Retry')}
                                </Button>
                            </Box>
                        </Paper>
                    ) : (
                        <GenerationLoading words={targetWords} realProgress={realProgress} />
                    )}
                </Box>
            </Container>
        )
    }

    return (
        <>
            {step === 'reading' && <ReadingProgressBar />}

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {step === 'reading' && articleData && (
                    <Fade in={true} timeout={800}>
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

                                        {/* Quiz History Section */}
                                        {quizHistory.length > 0 && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    {t('reading:sidebar.quizHistory', 'Quiz History')}
                                                </Typography>
                                                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {quizHistory.slice(0, 3).map((record) => (
                                                        <Paper
                                                            key={record.id}
                                                            variant="outlined"
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: 2,
                                                                bgcolor: 'background.default',
                                                                cursor: 'default'
                                                            }}
                                                        >
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(record.date).toLocaleDateString()}
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="bold" color="primary">
                                                                {record.score}%
                                                            </Typography>
                                                        </Paper>
                                                    ))}
                                                    {quizHistory.length > 3 && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
                                                            +{quizHistory.length - 3} {t('reading:sidebar.moreRecords', 'more')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </>
                                        )}
                                    </Paper>
                                </Box>
                            </Grid>

                            {/* Center - Article Content */}
                            <Grid item xs={12} lg={9}>
                                <ArticleContent
                                    title={articleData.title}
                                    content={articleData.content}
                                    onWordClick={handleWordClick}
                                    fontSize={fontSize}
                                />

                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    {isReviewMode ? (
                                        // Review mode: show two buttons
                                        <>
                                            <Button
                                                variant="contained"
                                                size="large"
                                                onClick={() => {
                                                    setViewMode('results')
                                                    setStep('quiz')
                                                }}
                                                sx={{
                                                    px: 4,
                                                    py: 1.5,
                                                    borderRadius: 8,
                                                    fontSize: '1.1rem',
                                                    background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
                                                    boxShadow: '0 4px 20px rgba(74, 144, 226, 0.3)',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'scale(1.02)',
                                                        boxShadow: '0 6px 24px rgba(74, 144, 226, 0.4)'
                                                    }
                                                }}
                                            >
                                                {t('reading:buttons.viewAnswers')}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="large"
                                                onClick={() => {
                                                    setViewMode('retake')
                                                    setQuizAnswers(null) // Clear previous answers for retake
                                                    setStep('quiz')
                                                }}
                                                sx={{
                                                    px: 4,
                                                    py: 1.5,
                                                    borderRadius: 8,
                                                    fontSize: '1.1rem',
                                                    borderColor: '#4A90E2',
                                                    color: '#4A90E2',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        borderColor: '#7B68EE',
                                                        backgroundColor: 'rgba(74, 144, 226, 0.05)',
                                                        transform: 'scale(1.02)'
                                                    }
                                                }}
                                            >
                                                {t('reading:buttons.retakeQuiz')}
                                            </Button>
                                        </>
                                    ) : (
                                        // Normal mode: single start button
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
                                            {t('reading:buttons.startQuiz')}
                                        </Button>
                                    )}
                                </Box>
                            </Grid>

                            {/* Right Toolbar */}
                            <Grid item xs={12} lg={1} sx={{ display: { xs: 'none', lg: 'block' } }}>
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
                    </Fade>
                )}

                {step === 'quiz' && articleData && (
                    <QuizView
                        readingQuestions={articleData.readingQuestions}
                        vocabularyQuestions={articleData.vocabularyQuestions}
                        onSubmit={handleQuizSubmit}
                        onBack={() => setStep('reading')}
                        initialAnswers={viewMode === 'results' ? quizAnswers || undefined : undefined}
                        readOnly={viewMode === 'results'}
                    />
                )}

                {step === 'feedback' && articleData && (
                    <ScoreFeedback
                        score={score}
                        totalQuestions={articleData.readingQuestions.length + articleData.vocabularyQuestions.length}
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
