import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
    useLocation,
    useNavigate,
    useParams,
    Routes,
    Route
} from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

// Services & Utils
import { Word, QuizRecord, Article } from '../services/db'
import { mockLLMService } from '../services/mockLLMService'
import { settingsService } from '../services/settingsService'
import { wordService } from '../services/wordService'
import { articleService } from '../services/articleService'
import { quizRecordService } from '../services/quizRecordService'
import { llmService } from '../services/llmService'
import { studyService } from '../services/studyService'

// Components
import ReadingLayout from '../components/reading/ReadingLayout'
import ArticleView from './ArticleView'
import QuizPage from './QuizPage'
import ResultPage from './ResultPage'
import GenerationLoading from '../components/reading/GenerationLoading'
import { useStudyTimer } from '../hooks/useStudyTimer'
import WordDetailModal from '../components/WordDetailModal'
import { PageLoading, PageError } from '../components/common'
import EmptyState from '../components/common/EmptyState'
import { Button } from '@mui/material'

// --- Route Wrappers ---

function QuizRouteWrapper({
    isIsGenerating,
    progress,
    onQuizSubmit,
    isSubmitting,
    quizHistory
}: {
    isIsGenerating: boolean
    progress: number
    onQuizSubmit: (id: number, answers: any) => void
    isSubmitting: boolean
    quizHistory: QuizRecord[]
}) {
    const { recordId } = useParams<{ recordId: string }>()
    const navigate = useNavigate()

    // Find matching record
    // 1. Try props history (fast)
    // 2. Fallback to DB fetch (refresh scenario) - implemented via simple effect for now or rely on parent updates
    // For now, let's assume parent 'quizHistory' is sufficient or we do a quick check

    // Actually, to be robust against Refresh, we should fetch if not found
    const [record, setRecord] = useState<QuizRecord | null>(null)

    useEffect(() => {
        if (!recordId) return
        const id = Number(recordId)

        // Try local first
        const found = quizHistory.find(r => r.id === id)
        if (found) {
            setRecord(found)
        } else {
            // Fetch from DB
            quizRecordService.getQuizRecordById(id).then(r => {
                if (r) setRecord(r)
            })
        }
    }, [recordId, quizHistory])

    if (isIsGenerating) {
        return <GenerationLoading mode="quiz" realProgress={progress} words={[]} />
    }

    if (!record) return null // Loading skeleton?

    return (
        <QuizPage
            isGenerating={false}
            progress={0}
            articleData={{
                title: '', // Not strictly needed by QuizView strictly speaking if we pass Qs
                content: '',
                readingQuestions: record.questions.reading || [],
                vocabularyQuestions: record.questions.vocabulary || []
            }}
            onQuizSubmit={(answers) => onQuizSubmit(record.id!, answers)}
            isSubmitting={isSubmitting}
            onExit={() => navigate('..')}
            readOnly={false}
        />
    )
}

function ResultRouteWrapper({
    quizHistory,
    onRetry
}: {
    quizHistory: QuizRecord[]
    onRetry: () => void
}) {
    const { recordId } = useParams<{ recordId: string }>()
    const navigate = useNavigate()
    const [record, setRecord] = useState<QuizRecord | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!recordId) return
        const id = Number(recordId)

        const found = quizHistory.find(r => r.id === id)
        if (found) {
            setRecord(found)
            setLoading(false)
        } else {
            quizRecordService.getQuizRecordById(id).then(r => {
                if (r) {
                    setRecord(r)
                } else {
                    setError(new Error(`Result not found for ID: ${recordId}`))
                }
                setLoading(false)
            }).catch(err => {
                setError(err)
                setLoading(false)
            })
        }
    }, [recordId, quizHistory])

    if (loading) return <PageLoading />
    if (error) return <PageError error={error} resetErrorBoundary={onRetry} />
    if (!record) return <PageError error={new Error('Result not found')} />

    return (
        <ResultPage
            result={record}
            onBackToArticle={() => navigate('..')}
            onRetry={onRetry}
        />
    )
}

export default function ReadingPage() {
    const { articleId } = useParams<{ articleId: string }>()
    const location = useLocation()
    const navigate = useNavigate()
    const { t } = useTranslation()

    // --- State ---
    const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
    const [targetWords, setTargetWords] = useState<Word[]>([])
    const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([])
    const [settings, setSettings] = useState<any>(null)
    const [fontSize, setFontSize] = useState<number>(() => {
        const saved = localStorage.getItem('reading_font_size')
        const parsed = Number(saved)
        return (!isNaN(parsed) && parsed >= 12 && parsed <= 32) ? parsed : 18
    })

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false)
    const [generationProgress, setGenerationProgress] = useState(0)
    const [generationMode, setGenerationMode] = useState<'article' | 'quiz'>('article')
    const [error, setError] = useState<Error | null>(null)
    const [isLoadingArticle, setIsLoadingArticle] = useState(false)

    // Quiz State
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false)
    // Removed viewingQuizId - now URL driven

    // Definition/Sentence Analysis Popover State
    const [popoverState, setPopoverState] = useState<{
        text: string
        type: 'word' | 'sentence'
        position: { top: number; left: number }
    } | null>(null)

    // New State for scrolling interaction (Moved to top level)
    const [scrollingWord, setScrollingWord] = useState<string | null>(null)

    const handleWordScroll = useCallback((word: string) => {
        setScrollingWord(word)
        // Reset after a short delay so clicking the same word again works
        setTimeout(() => setScrollingWord(null), 500)
    }, [])

    // Derived State
    // activeQuizRecord and latestResult are less critical now as we use URL, 
    // but useful for "Continue" button logic if needed.

    // Modal State
    const [wordDetailModalState, setWordDetailModalState] = useState<string | null>(null)


    const completedQuizzes = useMemo(() => {
        return quizHistory.filter(r => r.score !== undefined).sort((a, b) => b.date - a.date)
    }, [quizHistory])



    // Timer
    const { timeSpent, isActive: isTimerRunning, start: startTimer, pause: pauseTimer, reset: resetTimer } = useStudyTimer(false)

    // --- Initialization & Data Fetching ---
    useEffect(() => {
        settingsService.getSettings().then(setSettings)
    }, [])

    // Timer Logic: Auto-start when entering Quiz mode
    useEffect(() => {
        const isQuiz = location.pathname.includes('/quiz')
        // Only auto-start if not already running and we are in quiz mode
        if (isQuiz && !isTimerRunning) {
            startTimer()
        }
        // Optional: Pause when leaving? Or let manual controls handle it?
        // User said: "Reading time starts when user turns it on", "Quiz time enters immediately on".
    }, [location.pathname, isTimerRunning, startTimer])

    const loadArticle = useCallback(async (idOrUuid: string | number) => {
        try {
            console.log('📚 Loading article:', idOrUuid)
            let article: Article | undefined
            if (typeof idOrUuid === 'number' || !isNaN(Number(idOrUuid))) {
                article = await articleService.getById(Number(idOrUuid))
            } else {
                article = await articleService.getByUuid(String(idOrUuid))
            }

            if (!article) throw new Error('Article not found')

            setCurrentArticle(article)

            // Load words
            if (article.targetWords?.length) {
                const words = await Promise.all(article.targetWords.map(s => wordService.getWordBySpelling(s)))
                setTargetWords(words.filter((w): w is Word => !!w))
            }

            // Load History
            const history = await quizRecordService.getRecordsByArticleUuid(article.uuid)
            setQuizHistory(history)

            setLoadingArticle(false) // Reset loading if success
        } catch (err: any) {
            console.error('Failed to load article:', err)
            setError(err instanceof Error ? err : new Error(err.message || 'Failed to load article'))
            setLoadingArticle(false)
        }
    }, [])

    const setLoadingArticle = (loading: boolean) => {
        setIsLoadingArticle(loading)
    }



    const handleGenerateArticle = useCallback(async (words: Word[], settings: any, uuid?: string) => {
        setIsGenerating(true)
        setError(null)
        setGenerationMode('article')
        setGenerationProgress(0)

        // Prevent duplicates with a lock if needed (skipped for brevity, assuming effect dependency handles mostly)
        try {
            const apiCall = settings.apiKey ? llmService : mockLLMService
            const data = await apiCall.generateArticleOnly(words, settings, setGenerationProgress)

            const finalUuid = uuid || uuidv4()
            const newArticle: Article = {
                // id will be auto-incremented
                uuid: finalUuid,
                title: data.title,
                content: data.content,
                targetWords: data.targetWords,
                difficultyLevel: settings.difficultyLevel || 'L2',
                source: 'generated',
                wordCtxMeanings: data.word_study,
                createdAt: Date.now()
            }

            const id = await articleService.add(newArticle)
            // const savedArticle = { ...newArticle, id }

            // Do NOT update local state here. 
            // The navigation below will trigger a route change, forcing a remount/re-effect 
            // which will load the article from DB correctly.
            // Updating state here causes a "flash" of content before the route transition occurs.
            // setCurrentArticle(savedArticle)
            // setTargetWords(words)

            // Navigate to the real URL so refresh works
            navigate(`/read/${id}`, { replace: true })
        } catch (err: any) {
            console.error('Generation failed:', err)
            setError(err instanceof Error ? err : new Error(err.message || 'Generation failed'))
            setIsGenerating(false) // Only stop generating if error. If success, we navigate away.
        }
        // finally block removed to avoid setting isGenerating=false before unmount on success
    }, [navigate])

    // Generation Guard
    const generationAttemptRef = useRef<string | null>(null)

    // Handle Article Loading / Generation
    useEffect(() => {
        const state = location.state as any

        // Case 1: Generation requested (from Home)
        if (state?.mode === 'generate' && state?.words && !currentArticle && !isGenerating && !error) {
            // Prevent double-invocation in Strict Mode
            if (state.uuid && generationAttemptRef.current === state.uuid) {
                return
            }
            if (state.uuid) {
                generationAttemptRef.current = state.uuid
            }
            handleGenerateArticle(state.words, state.settings, state.uuid)
        }
        // Case 2: Load existing article by ID
        else if (articleId && !currentArticle && !isGenerating) {
            loadArticle(Number(articleId) || articleId)
        }
    }, [articleId, location.state, currentArticle, isGenerating, error, handleGenerateArticle, loadArticle])

    // --- Actions ---

    const handleFontSizeChange = (size: number) => {
        setFontSize(size)
        localStorage.setItem('reading_font_size', String(size))
    }

    // Popover Handlers
    const handleSelection = useCallback((text: string, position: { top: number; left: number }) => {
        if (!text) {
            setPopoverState(null)
            return
        }
        const type = (text.trim().includes(' ') || text.length > 20) ? 'sentence' : 'word'
        setPopoverState({ text, type, position })
    }, [])

    const handleClosePopover = useCallback(() => {
        setPopoverState(null)
    }, [])

    const handleDeepDive = useCallback((word: string) => {
        setPopoverState(null)
        setWordDetailModalState(word)
    }, [])

    const handleStartQuiz = useCallback(async () => {
        if (!currentArticle) return

        // Per user request: Always generate a new quiz when clicking Challenge
        // We keep old drafts (as per latest request) to build a question bank

        setIsGenerating(true)
        setGenerationMode('quiz')
        setGenerationProgress(0)

        try {
            // Generate Questions
            const apiCall = settings?.apiKey ? llmService : mockLLMService
            const quizData = await apiCall.generateQuizForArticle(
                currentArticle.content,
                targetWords,
                settings,
                setGenerationProgress
            )

            // Create Draft Record
            const draftRecord: Omit<QuizRecord, 'id'> = {
                articleId: currentArticle.uuid,
                date: Date.now(),
                questions: {
                    reading: quizData.readingQuestions,
                    vocabulary: quizData.vocabularyQuestions
                },
                userAnswers: { reading: {}, vocabulary: {} },
                score: undefined, // Explicitly mark as draft
                timeSpent: timeSpent, // Save combined time so far (backward comp), but also separate:
                readingDuration: timeSpent,
            }

            const newRecordId = await quizRecordService.saveQuizRecord(draftRecord)

            // Reset timer for Quiz Phase
            resetTimer()
            startTimer() // Ensure it starts immediately for quiz

            const updatedHistory = await quizRecordService.getRecordsByArticleUuid(currentArticle.uuid)
            setQuizHistory(updatedHistory)

            // No second setQuizHistory needed
            // setQuizHistory(updatedHistory)

            navigate(`quiz/${newRecordId}`)
        } catch (err) {
            console.error('Quiz generation failed:', err)
            // Show snackbar?
        } finally {
            setIsGenerating(false)
        }
    }, [currentArticle, settings, targetWords, timeSpent, navigate, startTimer, resetTimer])

    const handleQuizSubmit = useCallback(async (recordId: number, answers: { reading: Record<string, string>; vocabulary: Record<string, string | string[]> }) => {
        setIsSubmittingQuiz(true)
        try {
            // New decoupled logic using studyService
            const result = await studyService.submitQuizSession(
                recordId,
                answers,
                targetWords, // Pass current target words for SRS mapping
                timeSpent    // Pass current timer (quiz duration)
            )

            // 4. Refresh History & Navigate
            if (currentArticle) {
                const updated = await quizRecordService.getRecordsByArticleUuid(currentArticle.uuid)
                setQuizHistory(updated)
            }

            // Navigate to Absolute Path
            if (articleId) {
                navigate(`/read/${articleId}/result/${result.recordId}`, { replace: true })
            } else {
                navigate(`../result/${result.recordId}`, { replace: true })
            }

        } catch (err) {
            console.error('Submit failed:', err)
        } finally {
            setIsSubmittingQuiz(false)
            pauseTimer()
        }
    }, [currentArticle, targetWords, timeSpent, articleId, navigate, pauseTimer])





    const handleHoverWord = useCallback((_word: string | null) => {
        // TODO: Implement Sidebar hover logic if needed
    }, [])

    const handleReviewQuiz = useCallback((record: QuizRecord) => {
        if (!currentArticle) return
        navigate(`/read/${currentArticle.id}/result/${record.id}`)
    }, [navigate, currentArticle])

    // --- Render ---

    if (isGenerating) {
        // Can be improved to show specific loading state context
        return <GenerationLoading mode={generationMode} realProgress={generationProgress} words={targetWords} />
    }

    if (error) {
        const state = location.state as any
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <EmptyState
                    icon="⚠️"
                    title={t ? t('reading:error.title') : 'Generation Failed'}
                    description={error.message}
                    action={
                        <div style={{ display: 'flex', gap: 10 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/')}
                            >
                                {t ? t('reading:error.back') : 'Go Back'}
                            </Button>
                            {state?.mode === 'generate' && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        if (state?.words && state?.settings) {
                                            handleGenerateArticle(state.words, state.settings)
                                        } else {
                                            window.location.reload()
                                        }
                                    }}
                                >
                                    {t ? t('reading:error.retry') : 'Try Again'}
                                </Button>
                            )}
                        </div>
                    }
                />
            </div>
        )
    }

    if (isLoadingArticle) {
        return <PageLoading message={t('common:common.loading')} />
    }

    if (!currentArticle) {
        // Initial loading or 404
        return <PageLoading message={t('common:common.loading')} />
    }

    // Determine layout mode based on route
    const isQuizOrResult = location.pathname.includes('/quiz') || location.pathname.includes('/result')
    const sidebarVisible = !isQuizOrResult

    return (
        <ReadingLayout
            title={currentArticle.title}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
            targetWords={targetWords}
            activeWord={null} // TODO: Track active word from Hover
            onHoverWord={handleHoverWord}
            quizHistory={completedQuizzes}
            onStartQuiz={handleStartQuiz}
            onReviewQuiz={handleReviewQuiz}
            onTimerToggle={isTimerRunning ? pauseTimer : startTimer}
            isTimerRunning={isTimerRunning}
            seconds={timeSpent}
            onTimerReset={resetTimer}
            wordContexts={currentArticle.wordCtxMeanings}
            sidebarVisible={sidebarVisible}
            onWordScroll={handleWordScroll}
            headerVisible={!location.pathname.includes('/result')}
            showFontControls={sidebarVisible}
            showTimer={!location.pathname.includes('/result')}
        >
            <Routes>
                <Route index element={
                    <ArticleView
                        article={currentArticle}
                        fontSize={fontSize}
                        settings={settings}
                        onSelection={handleSelection}
                        popoverState={popoverState}
                        onClosePopover={handleClosePopover}
                        onDeepDive={handleDeepDive}
                        scrollToWord={scrollingWord}
                    />
                } />
                <Route path="quiz/:recordId" element={
                    <QuizRouteWrapper
                        isIsGenerating={isGenerating}
                        progress={generationProgress}
                        onQuizSubmit={handleQuizSubmit}
                        isSubmitting={isSubmittingQuiz}
                        quizHistory={quizHistory}
                    />
                } />
                <Route path="result/:recordId" element={
                    <ResultRouteWrapper
                        quizHistory={quizHistory} // Use full history so we can find the just-completed one if not filtered yet
                        onRetry={handleStartQuiz}
                    />
                } />
            </Routes>

            {/* Word Detail Modal for Deep Dive */}
            {wordDetailModalState && (
                <WordDetailModal
                    open={!!wordDetailModalState}
                    word={wordDetailModalState}
                    onClose={() => setWordDetailModalState(null)}
                />
            )}
        </ReadingLayout>
    )
}
