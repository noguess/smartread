import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Container, Box, Typography, Button, Grid, Paper, Chip, Fade, Divider, Snackbar, Alert, CircularProgress, AlertColor } from '@mui/material'

import { Word, History, Article, QuizRecord } from '../services/db'
import { mockLLMService, GeneratedContent } from '../services/mockLLMService'
import { llmService } from '../services/llmService'
import { settingsService } from '../services/settingsService'
import { SRSAlgorithm } from '../utils/SRSAlgorithm'
import { wordService } from '../services/wordService'
import { historyService } from '../services/historyService'
import { articleService } from '../services/articleService'
import { quizRecordService } from '../services/quizRecordService'
import { calculateNewDifficulty, DifficultyLevel } from '../utils/difficultyLogic'
import ArticleContent from '../components/reading/ArticleContent'
import QuizView from '../components/reading/QuizView'
import WordDetailModal from '../components/WordDetailModal'
import ReadingProgressBar from '../components/reading/ReadingProgressBar'
import ReadingToolbar from '../components/reading/ReadingToolbar'
import ReadingTimer from '../components/reading/ReadingTimer'
import GenerationLoading from '../components/reading/GenerationLoading'
import DefinitionPopover from '../components/reading/DefinitionPopover'
import SentenceAnalysisPopover from '../components/reading/SentenceAnalysisPopover'
import { useTranslation } from 'react-i18next'
import { useStudyTimer } from '../hooks/useStudyTimer'
import EmptyState from '../components/common/EmptyState'
import { ErrorOutline } from '@mui/icons-material'

type Step = 'initializing' | 'generating' | 'reading' | 'quiz' | 'feedback' | 'review'
type FontSize = 'small' | 'medium' | 'large'

// Track active generations to prevent duplicates in StrictMode
const generatingUuids = new Set<string>()

export default function ReadingPage() {
    const { t } = useTranslation(['reading'])
    const { id } = useParams<{ id: string }>()
    const location = useLocation()
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>('initializing')
    const [fontSize, setFontSize] = useState<FontSize>(() => {
        return (localStorage.getItem('reading_font_size') as FontSize) || 'medium'
    })
    const [articleData, setArticleData] = useState<GeneratedContent | null>(null)
    const [targetWords, setTargetWords] = useState<Word[]>([])
    const [selectedWord, setSelectedWord] = useState<string>('')
    const [isWordModalOpen, setIsWordModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [generationMode, setGenerationMode] = useState<'article' | 'quiz'>('article')

    const [quizAnswers, setQuizAnswers] = useState<{
        reading: Record<string, string>
        vocabulary: Record<string, string | string[]>
    } | null>(null)

    const [isReviewMode, setIsReviewMode] = useState(false)
    const [viewMode, setViewMode] = useState<'results' | 'retake' | null>(null)

    const [error, setError] = useState<string | null>(null)
    const [realProgress, setRealProgress] = useState(0)

    const topRef = useRef<HTMLDivElement>(null)

    // New state for V2.0 support
    const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
    const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([])

    // Snackbar Notification State
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('info')

    // Quiz Result State (for Banner)
    const [quizResult, setQuizResult] = useState<{
        score: number
        total: number
        message?: string
        stats?: {
            reading: { correct: number; total: number }
            vocabulary: { correct: number; total: number }
        }
    } | undefined>(undefined)

    // Settings State
    const [settings, setSettings] = useState<any>(null)

    // Definition/Sentence Analysis Popover State
    const [popoverState, setPopoverState] = useState<{
        text: string
        type: 'word' | 'sentence'
        position: { top: number; left: number }
    } | null>(null)

    useEffect(() => {
        // Load settings independently
        settingsService.getSettings().then(setSettings)
    }, [])

    // Scroll to top whenever step changes
    useEffect(() => {
        // Use scrollIntoView which works regardless of whether the scroll container is window or a div
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [step])

    const handleSelection = (text: string, position: { top: number; left: number }) => {
        // Close if selecting a new word or clearing
        if (!text) {
            setPopoverState(null)
            return
        }

        // Determine if it's a word or sentence
        // Heuristic: If it has spaces or is very long, treat as sentence
        const type = (text.trim().includes(' ') || text.length > 20) ? 'sentence' : 'word'

        setPopoverState({ text, type, position })
    }

    const handleDeepDive = (word: string) => {
        setPopoverState(null) // Close popover
        handleWordClick(word) // Open full modal
    }

    const handleClosePopover = () => {
        setPopoverState(null)
    }

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
            setStep('generating') // Explicitly switch to generation UI
            const uuid = state.uuid
            console.log('✅ Detected generation mode. UUID:', uuid)

            // Prevent duplicate generation for certain UUID (StrictMode fix)
            if (uuid && generatingUuids.has(uuid)) {
                console.log('🚫 Generation already in progress for this UUID, skipping...')
                return
            }

            if (uuid) {
                // LOCK IMMEDIATELY to prevent StrictMode double-fire
                generatingUuids.add(uuid)

                // Check if already exists in DB (async check cannot block sync effect, 
                // but checking generatingUuids handles the immediate double-fire)
                articleService.getByUuid(uuid).then(async (existing) => {
                    if (existing) {
                        console.log('✅ Article already exists, loading instead of generating:', existing)
                        setCurrentArticle(existing)
                        setArticleData({
                            title: existing.title,
                            content: existing.content,
                            readingQuestions: [],
                            vocabularyQuestions: []
                        })

                        // Load target words
                        const words = await Promise.all(
                            existing.targetWords.map(spelling => wordService.getWordBySpelling(spelling))
                        )
                        setTargetWords(words.filter((w): w is Word => !!w))

                        // Remove lock since we are done "generating" (loading existing)
                        generatingUuids.delete(uuid)

                        setStep('reading')
                    } else {
                        // Proceed with generation if not found
                        setTargetWords(state.words)
                        generateAndSaveNewArticle(state.words, state.settings, uuid)
                    }
                })
                return
            }

            setTargetWords(state.words)
            generateAndSaveNewArticle(state.words, state.settings)
        }
        // Priority 2: Load from URL parameter (V2.0 behavior - existing article)
        else if (id) {
            console.log('✅ Detected article ID - will load existing article:', id)
            // Keep state as 'initializing' to avoid showing generation UI
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
            setStep('generating')
            setGenerationMode('article')
            setTargetWords(state.words)
            generateContent(state.words)
        }
        // Priority 5: Load from Quiz ID (Review Mode from Home)
        else if (state?.quizId) {
            console.log('✅ Detected quiz review mode from navigation test:', state.quizId)
            // We need to wait for article to load first, so we might need a separate effect or handle it after loading article
            // Actually, if we have 'id' param, loadArticleById handles the article. 
            // We just need to trigger review mode *after* article is ready.
            // Let's handle this by checking state.quizId inside loadArticleById or a separate effect dependent on quizHistory
        }
        // Fallback: Navigate to home ONLY if we're not already in a loading state
        else if (step !== 'generating' && step !== 'initializing') {
            console.log('⚠️ No valid state detected - navigating to home')
            navigate('/')
        }
    }, [id, location.state])

    const loadArticleById = async (articleId: number) => {
        try {
            setError(null)
            // Do NOT set 'generating' here, assume 'initializing' or current state handles spinner
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
            // If error, we might want to show error UI, which is currently bound to 'generating' step block
            // So we might need to setStep('generating') to show the error or handle error separately
            setStep('generating')
        }
    }

    // Effect to handle opening specific quiz review if navigated with quizId
    useEffect(() => {
        const state = location.state as any
        if (state?.quizId && step === 'reading' && quizHistory.length > 0) {
            console.log('🔄 Attempting to open specific quiz review:', state.quizId)
            const record = quizHistory.find(q => q.id === state.quizId) || quizHistory.find(q => q.id === Number(state.quizId))
            if (record) {
                loadQuizReviewFromRecord(record)
                // Clear state to prevent reopening on generic re-renders, but keeping it in history is fine
                // window.history.replaceState({}, '') 
            }
        }
    }, [step, quizHistory, location.state])

    const loadQuizReviewFromRecord = (record: QuizRecord) => {
        console.log('📖 Loading review for quiz:', record.id)

        // Restore answers
        setQuizAnswers(record.userAnswers)

        // Calculate result for banner
        const readingTotal = record.questions.reading.length
        const vocabTotal = record.questions.vocabulary.length

        // We need to recalculate counts from record.wordResults and answers since QuizRecord stores score but not explicit counts structure for the banner
        // Or we can simple approximate or just reconstruct.
        // Actually, we can reconstruct exactly if we check answers against (now loaded) articleData questions?
        // But wait, articleData questions might be different if we re-generated? 
        // V2: QuizRecord stores the questions at that time. We should use THOSE questions.

        // CRITICAL: Update articleData with the questions FROM THE RECORD to ensure consistency
        if (articleData) {
            setArticleData({
                ...articleData,
                readingQuestions: record.questions.reading,
                vocabularyQuestions: record.questions.vocabulary
            })
        }

        // Re-calculate stats for the Banner
        let readingCorrect = 0
        record.questions.reading.forEach(q => {
            if (record.userAnswers.reading[q.id] === q.answer) readingCorrect++
        })

        let vocabCorrect = 0
        // We can use the persisted wordResults to help count, or re-verify. 
        // Re-verifying is safer if we trust the record's questions.
        if (record.wordResults) {
            Object.values(record.wordResults).forEach(isCorrect => {
                if (isCorrect) vocabCorrect++
            })
        }
        // Note: wordResults keys are spellings. This might not directly map to question count if multiple questions target same word (rare).
        // Better to re-grade simply:
        vocabCorrect = 0
        record.questions.vocabulary.forEach(q => {
            const userAns = record.userAnswers.vocabulary[q.id]
            // logic same as grading... simplified for 'isCorrect' check:
            // Let's just trust record.score for the big number, and approximations for the breakdown if needed.
            // Actually, let's re-grade strictly to be safe for display
            const correctAns = q.answer
            let isCorrect = false
            if (Array.isArray(correctAns) && Array.isArray(userAns)) {
                isCorrect = JSON.stringify(correctAns) === JSON.stringify(userAns) // Simple array check
            } else {
                isCorrect = (userAns as string)?.toLowerCase() === (correctAns as string)?.toLowerCase()
            }
            if (isCorrect) vocabCorrect++
        })


        setQuizResult({
            score: record.score,
            total: 100,
            message: undefined, // No difficulty adjustment on historical review
            stats: {
                reading: { correct: readingCorrect, total: readingTotal },
                vocabulary: { correct: vocabCorrect, total: vocabTotal }
            }
        })

        setViewMode('results')
        setStep('review')
    }



    const loadReviewContent = async (record: History) => {
        try {
            // Reconstruct article data
            const data: GeneratedContent = {
                title: record.title || (t('reading:defaultReviewTitle') + new Date(record.date).toLocaleDateString()),
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
            navigate('/history', {
                state: {
                    error: t('reading:error.loadReviewFailed', { error: error instanceof Error ? error.message : 'Unknown error' })
                }
            })
        }
    }

    const generateAndSaveNewArticle = async (words: Word[], settings: any, preGeneratedUuid?: string) => {
        const uuid = preGeneratedUuid

        try {
            if (uuid) {
                // Only add if not already added (though Set handles this, strict logic helps clarity)
                generatingUuids.add(uuid)
            }

            setStep('generating')
            setGenerationMode('article')
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
            const finalUuid = uuid || uuidv4() // Use passed UUID or generate new one

            const article = {
                uuid: finalUuid,
                title: articleData.title,
                content: articleData.content,
                targetWords: articleData.targetWords,
                difficultyLevel: settings.difficultyLevel || 'L2',
                source: 'generated' as const,
                wordCtxMeanings: articleData.word_study
            }

            let articleId: number
            try {
                articleId = await articleService.add(article)
                console.log('Article saved to database with ID:', articleId)
            } catch (error) {
                // Check if it's a constraint error (Dexie error name is 'ConstraintError')
                if ((error as any).name === 'ConstraintError') {
                    console.warn('Duplicate article detected (DB constraint). Loading existing one.')
                    const existing = await articleService.getByUuid(finalUuid)
                    if (!existing || !existing.id) throw new Error('Could not recover existing article')
                    articleId = existing.id
                } else {
                    throw error
                }
            }

            // Set current article and article data for display
            setCurrentArticle({ ...article, id: articleId, createdAt: Date.now() })
            setArticleData({
                title: articleData.title,
                content: articleData.content,
                readingQuestions: [],
                vocabularyQuestions: []
            })

            // Update URL without navigation (optional - keeps clean URL)
            window.history.replaceState({}, '', `/ read / ${articleId} `)

            setStep('reading')
        } catch (error) {
            console.error('Failed to generate and save article:', error)
            setError(error instanceof Error ? error.message : 'Failed to generate article')
        } finally {
            if (uuid) {
                generatingUuids.delete(uuid)
            }
        }
    }


    const generateContent = async (words: Word[]) => {
        try {
            setStep('generating')
            setGenerationMode('article')
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
                const articleOnly = await llmService.generateArticleOnly(
                    words,
                    settings,
                    (progress: number) => {
                        console.log('📊 Real API Download progress:', progress + '%')
                        setRealProgress(progress)
                    }
                )
                data = {
                    ...articleOnly,
                    readingQuestions: [],
                    vocabularyQuestions: []
                }
            } else {
                // Fallback to Mock with progress callback
                console.warn('No API Key found. Using Mock Service.')
                const articleOnly = await mockLLMService.generateArticleOnly(
                    words,
                    settings,
                    (progress: number) => {
                        console.log('🎭 Mock progress:', progress + '%')
                        setRealProgress(progress)
                    }
                )
                data = {
                    ...articleOnly,
                    readingQuestions: [],
                    vocabularyQuestions: []
                }
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

    const handleStartQuiz = async () => {
        if (!currentArticle || !articleData) {
            console.error('Cannot start quiz: missing article data')
            return
        }

        try {
            setStep('generating')
            setGenerationMode('quiz')
            setError(null)
            setRealProgress(0)
            console.log('Starting quiz generation for article:', currentArticle.title)

            const settings = await settingsService.getSettings()
            if (!settings) {
                throw new Error('Settings not configured')
            }

            // Generate quiz for the current article
            const quizData = settings.apiKey
                ? await llmService.generateQuizForArticle(
                    articleData.content,
                    targetWords,
                    settings,
                    (progress) => {
                        console.log('📊 Quiz generation progress:', progress + '%')
                        setRealProgress(progress)
                    }
                )
                : await mockLLMService.generateQuizForArticle(
                    articleData.content,
                    targetWords,
                    settings,
                    (progress) => {
                        console.log('🎭 Mock quiz progress:', progress + '%')
                        setRealProgress(progress)
                    }
                )

            console.log('Quiz generation successful:', quizData)

            // Update article data with new questions
            setArticleData({
                ...articleData,
                readingQuestions: quizData.readingQuestions,
                vocabularyQuestions: quizData.vocabularyQuestions
            })

            setStep('quiz')
        } catch (error) {
            console.error('Failed to generate quiz:', error)
            // Fix: Use Snackbar instead of blocking Error UI for better UX
            setSnackbarMessage(error instanceof Error ? error.message : t('reading:error.generationFailed', { error: 'Quiz generation failed' }))
            setSnackbarSeverity('error')
            setSnackbarOpen(true)

            // Revert step to 'reading' so user sees the article again
            setStep('reading')
        }
    }

    const handleQuizSubmit = async (answers: { reading: Record<string, string>; vocabulary: Record<string, string | string[]> }) => {
        if (!articleData) return

        setIsSubmitting(true)
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

        // Precise SRS Update Logic
        const wordResults: { [spelling: string]: boolean } = {}

        console.log('🔄 Starting SRS updates...')
        console.log('Target words available:', targetWords.length)
        console.log('Vocabulary questions:', articleData.vocabularyQuestions.length)

        for (const q of articleData.vocabularyQuestions) {
            console.log(`Processing question for targetWord: "${q.targetWord}"`)

            // Enhanced word matching with multiple fallback strategies
            let word = targetWords?.find(w => w.spelling === q.targetWord)

            if (!word) {
                // Fallback 1: Check if stem contains any target word
                const stemLower = q.stem.toLowerCase()
                word = targetWords?.find(w => stemLower.includes(w.spelling.toLowerCase()))

                if (word) {
                    console.log(`   Found via stem match: "${word.spelling}"`)
                }
            }

            if (!word && q.answer && typeof q.answer === 'string') {
                // Fallback 2: Check if answer matches any target word
                word = targetWords?.find(w => w.spelling.toLowerCase() === (q.answer as string).toLowerCase())

                if (word) {
                    console.log(`   Found via answer match: "${word.spelling}"`)
                }
            }

            if (word && word.id) {
                const userAnswer = answers.vocabulary[q.id]
                const correctAnswer = q.answer

                let isCorrect = false
                if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
                    isCorrect = correctAnswer.length === userAnswer.length &&
                        correctAnswer.every((val, index) => val === userAnswer[index])
                } else {
                    // Case-insensitive comparison for string answers
                    const userAnsLower = typeof userAnswer === 'string' ? userAnswer.toLowerCase() : userAnswer
                    const correctAnsLower = typeof correctAnswer === 'string' ? correctAnswer.toLowerCase() : correctAnswer
                    isCorrect = userAnsLower === correctAnsLower
                }

                wordResults[word.spelling] = isCorrect

                console.log(`✅ Word "${word.spelling}"(ID: ${word.id}): ${isCorrect ? 'Correct' : 'Wrong'} `)

                // Update SRS based on specific question result
                const updates = SRSAlgorithm.calculateNextReview(word, isCorrect)
                console.log(`   SRS updates for "${word.spelling}": `, updates)
                await wordService.updateWord(word.id, updates)
                console.log(`   ✓ Word status updated`)
            } else {
                console.warn(`⚠️ Could not find word object for targetWord: "${q.targetWord}"`)
                console.warn(`   Question stem: `, q.stem)
                console.warn(`   Available words: `, targetWords.map(w => w.spelling))
            }
        }

        console.log('✅ SRS updates complete. Word results:', wordResults)

        // --- Saving & Transition Logic ---
        const readingTotal = articleData.readingQuestions.length
        const vocabTotal = articleData.vocabularyQuestions.length
        const total = readingTotal + vocabTotal

        // Weighted Score Calculation
        const vocabScore = totalCorrect - readingCorrect
        const readingWeight = readingTotal > 0 ? (readingCorrect / readingTotal) * 40 : 0
        const vocabWeight = vocabTotal > 0 ? (vocabScore / vocabTotal) * 60 : 0
        const scorePercentage = Math.round(readingWeight + vocabWeight)

        // Difficulty Adjustment Logic
        const readingAccuracy = readingTotal > 0 ? readingCorrect / readingTotal : 0
        const totalAccuracy = total > 0 ? totalCorrect / total : 0

        const adjustMsg = await checkAndAdjustDifficulty({ readingAccuracy, totalAccuracy })

        setQuizResult({
            score: scorePercentage,
            total: 100,
            message: adjustMsg || undefined,
            stats: {
                reading: {
                    correct: readingCorrect,
                    total: readingTotal
                },
                vocabulary: {
                    correct: vocabCorrect,
                    total: vocabTotal
                }
            }
        })

        if (adjustMsg) {
            setSnackbarMessage(adjustMsg)
            setSnackbarOpen(true)
        }

        const difficultyFeedback = 3

        if (currentArticle) {
            console.log('Saving quiz record for V2.0 article:', currentArticle.uuid)
            const quizRecord: Omit<QuizRecord, 'id'> = {
                articleId: currentArticle.uuid,
                date: Date.now(),
                questions: {
                    reading: articleData.readingQuestions,
                    vocabulary: articleData.vocabularyQuestions
                },
                userAnswers: answers,
                score: scorePercentage,
                difficultyFeedback: difficultyFeedback,
                timeSpent: timeSpent,
                wordResults: wordResults
            }
            await quizRecordService.saveQuizRecord(quizRecord)

            // Refresh history
            const updatedHistory = await quizRecordService.getRecordsByArticleUuid(currentArticle.uuid)
            setQuizHistory(updatedHistory)
        } else {
            // Legacy
            const historyRecord: Omit<History, 'id'> = {
                date: Date.now(),
                title: articleData.title,
                articleContent: articleData.content,
                targetWords: targetWords.map(w => w.spelling),
                questionsJson: {
                    reading: articleData.readingQuestions,
                    vocabulary: articleData.vocabularyQuestions
                },
                userScore: scorePercentage,
                difficultyFeedback: difficultyFeedback,
                timeSpent: timeSpent,
                wordResults: wordResults,
                userAnswers: answers
            }
            await historyService.saveArticleRecord(historyRecord)
        }

        setIsSubmitting(false)
        setStep('review')
    }

    const checkAndAdjustDifficulty = async (stats: { readingAccuracy: number, totalAccuracy: number }): Promise<string> => {
        const settings = await settingsService.getSettings()
        const currentLevel = settings?.difficultyLevel || 'L2'

        // Use the pure function for logic
        const newLevel = calculateNewDifficulty(
            currentLevel as DifficultyLevel,
            stats
        )
        let message = ''

        if (newLevel !== currentLevel) {
            console.log(`🔄 Adjusting difficulty: ${currentLevel} -> ${newLevel} `)
            await settingsService.saveSettings({ difficultyLevel: newLevel })
            message = t('reading:difficultyChanged', `Difficulty adjusted to ${newLevel} `, { level: newLevel })
        } else {
            console.log('✅ Difficulty remains unchanged')
        }

        return message
    }

    const handleWordClick = (word: string) => {
        setSelectedWord(word)
        setIsWordModalOpen(true)
    }

    const handleFontSizeChange = (newSize: FontSize) => {
        setFontSize(newSize)
        localStorage.setItem('reading_font_size', newSize)
    }

    if (step === 'initializing') {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    if (step === 'generating') {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {error ? (
                        <EmptyState
                            icon={<ErrorOutline sx={{ fontSize: 64, color: 'error.main' }} />}
                            title={t('reading:error.generationFailed', 'Generation Failed')}
                            description={error}
                            action={
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                    <Button variant="outlined" onClick={() => navigate('/')}>
                                        {t('common:button.back', 'Back')}
                                    </Button>
                                    <Button variant="contained" onClick={handleRetry}>
                                        {t('common:button.retry', 'Retry')}
                                    </Button>
                                </Box>
                            }
                        />
                    ) : (
                        <GenerationLoading words={targetWords} realProgress={realProgress} mode={generationMode} />
                    )}
                </Box>
            </Container>
        )
    }

    return (
        <Box ref={topRef}>
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
                                            label={t(`reading:sidebar.${currentArticle?.difficultyLevel === 'L1' ? 'beginner' :
                                                currentArticle?.difficultyLevel === 'L3' ? 'advanced' :
                                                    'intermediate'
                                                }`)}
                                            size="small"
                                            color="primary"
                                            sx={{ mb: 2 }}
                                        />

                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                                            {t('reading:sidebar.targetWords')}
                                        </Typography>
                                        {currentArticle?.wordCtxMeanings && currentArticle.wordCtxMeanings.length > 0 ? (
                                            <Box sx={{ mt: 1, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', pr: 0.5 }}>
                                                {currentArticle.wordCtxMeanings.map((item, idx) => (
                                                    <Box key={idx} sx={{ mb: 1, pb: 0.5, borderBottom: '1px dashed #eee' }}>
                                                        <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                                                            <Box component="span" fontWeight="bold" color="primary.main">{item.word}</Box>
                                                            <Box component="span" color="text.secondary" sx={{ mx: 0.5, fontSize: '0.75em' }}>{item.part_of_speech}</Box>
                                                            <Box component="span" color="text.primary">{item.meaning_in_context}</Box>
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="h6" color="primary.main" fontWeight="bold">
                                                {targetWords.length}
                                            </Typography>
                                        )}

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
                                                            onClick={() => loadQuizReviewFromRecord(record)}
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: 2,
                                                                bgcolor: 'background.default',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                transition: 'all 0.2s',
                                                                '&:hover': {
                                                                    borderColor: 'primary.main',
                                                                    bgcolor: 'action.hover'
                                                                }
                                                            }}
                                                        >
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(record.date).toLocaleDateString(undefined, {
                                                                    month: 'numeric',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="bold" color="primary">
                                                                {record.score}
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
                                    onSelection={handleSelection} // Pass selection handler
                                    fontSize={fontSize}
                                />

                                {/* Word Definition Popover */}
                                {popoverState?.type === 'word' && (
                                    <DefinitionPopover
                                        word={popoverState.text}
                                        anchorPosition={popoverState.position}
                                        onClose={handleClosePopover}
                                        onDeepDive={handleDeepDive}
                                    />
                                )}

                                {/* Sentence Analysis Popover */}
                                {popoverState?.type === 'sentence' && settings && (
                                    <SentenceAnalysisPopover
                                        sentence={popoverState.text}
                                        anchorPosition={popoverState.position}
                                        onClose={handleClosePopover}
                                        settings={settings}
                                        articleId={currentArticle?.uuid || ''}
                                    />
                                )}

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
                                            onClick={handleStartQuiz}
                                            disabled={!currentArticle}
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
                        isSubmitting={isSubmitting}
                    />
                )}

                {step === 'review' && articleData && quizAnswers && (
                    <QuizView
                        readingQuestions={articleData.readingQuestions}
                        vocabularyQuestions={articleData.vocabularyQuestions}
                        onSubmit={() => { }} // Not used in readOnly mode
                        onExit={() => setStep('reading')} // Exit Review -> Back to Article/Reading
                        onBack={() => setStep('reading')} // Back -> Exit (There is no ScoreFeedback now)
                        initialAnswers={quizAnswers}
                        readOnly={true}
                        result={quizResult}
                    />
                )}

                {/* Feedback step removed */}

                <WordDetailModal
                    word={selectedWord}
                    open={isWordModalOpen}
                    onClose={() => setIsWordModalOpen(false)}
                />

                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={6000}
                    onClose={() => setSnackbarOpen(false)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setSnackbarOpen(false)}
                        severity={snackbarSeverity}
                        sx={{ width: '100%', boxShadow: 3 }}
                        variant="filled"
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    )
}
