import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Grid, Typography, Container, Snackbar, Alert } from '@mui/material'
import { wordService } from '../services/wordService'
import { historyService } from '../services/historyService'
import { settingsService } from '../services/settingsService'
import { Word, History, WordStatus } from '../services/db'
import { WordSelector } from '../utils/WordSelector'
import DashboardHero from '../components/dashboard/DashboardHero'
import DashboardStats from '../components/dashboard/DashboardStats'
import { articleService } from '../services/articleService'
import { quizRecordService } from '../services/quizRecordService'
import RecentActivityList, { DashboardActivity } from '../components/dashboard/RecentActivityList'
import ManualGenerationDialog from '../components/dashboard/ManualGenerationDialog'
import { useTranslation } from 'react-i18next'

export default function HomePage() {
    const { t } = useTranslation(['home'])
    const navigate = useNavigate()
    const location = useLocation()
    const [allWords, setAllWords] = useState<Word[]>([])
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMsg, setSnackbarMsg] = useState('')
    const [statusCounts, setStatusCounts] = useState<Record<WordStatus, number>>({
        New: 0,
        Learning: 0,
        Review: 0,
        Mastered: 0,
    })
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)

    const [stats, setStats] = useState({
        consecutiveDays: 0,
        totalMinutes: 0,
        lastLearningDate: '',
    })
    const [recommendedWord, setRecommendedWord] = useState<Word | null>(null)

    const [activities, setActivities] = useState<DashboardActivity[]>([])

    useEffect(() => {
        loadData()

        // Check for message in navigation state
        const state = location.state as { message?: string }
        if (state?.message) {
            setSnackbarMsg(state.message)
            setSnackbarOpen(true)
            // Clear state to prevent showing again on refresh
            window.history.replaceState({}, document.title)
        }
    }, [])

    const loadData = async () => {
        const words = (await wordService.getAllWords()) || []
        const hist = (await historyService.getHistory()) || []

        // Load V2 Data
        const articles = (await articleService.getAll()) || []
        const quizzes = (await quizRecordService.getAll()) || []

        setAllWords(words)

        // Process Activities
        const articleMap = new Map(articles.map(a => [a.uuid, a]))

        const articleActivities: DashboardActivity[] = articles.map(a => ({
            id: a.id!,
            type: 'article',
            title: a.title,
            date: a.createdAt,
            difficultyLevel: a.difficultyLevel,
            articleId: a.id // Keep same ID for direct article access
        }))

        const quizActivities: DashboardActivity[] = quizzes.map(q => {
            const article = articleMap.get(q.articleId)
            return {
                id: q.id!,
                type: 'quiz',
                title: article ? article.title : t('home:recentActivity.unknownArticle'),
                date: q.date,
                score: q.score,
                articleId: article?.id
            }
        })

        // Merge and Sort
        const allActivities = [...articleActivities, ...quizActivities]
            .sort((a, b) => b.date - a.date)

        setActivities(allActivities)

        const counts = {
            New: 0,
            Learning: 0,
            Review: 0,
            Mastered: 0,
        }
        words.forEach((w) => {
            counts[w.status]++
        })
        setStatusCounts(counts)

        // Calculate Stats
        // Merge legacy history with new quiz records for stats calculation if needed
        // For now, we prefer V2 stats but keep V1 compatibility
        calculateStats(hist, quizzes)

        // Select Recommended Word
        if (words.length > 0) {
            const reviewWords = words.filter(w => w.status === 'Review')
            const learningWords = words.filter(w => w.status === 'Learning')
            const newWords = words.filter(w => w.status === 'New')

            let pool = reviewWords
            if (pool.length === 0) pool = learningWords
            if (pool.length === 0) pool = newWords
            if (pool.length === 0) pool = words

            if (pool.length > 0) {
                const random = pool[Math.floor(Math.random() * pool.length)]
                setRecommendedWord(random)
            }
        }
    }

    const calculateStats = (hist: History[], quizzes: any[]) => {
        // Construct a unified timeline for stats
        const relevantDates = [
            ...hist.map(h => h.date),
            ...quizzes.map(q => q.date)
        ].sort((a, b) => b - a)

        // Total Minutes
        const v1Seconds = hist.reduce((acc, curr) => acc + (curr.timeSpent || 300), 0)
        const v2Seconds = quizzes.reduce((acc, curr) => acc + (curr.timeSpent || 300), 0)
        const totalMinutes = Math.floor((v1Seconds + v2Seconds) / 60)

        // Consecutive Days
        let consecutive = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const uniqueDates = Array.from(new Set(relevantDates.map(ts => {
            const d = new Date(ts)
            d.setHours(0, 0, 0, 0)
            return d.getTime()
        }))).sort((a, b) => b - a)

        if (uniqueDates.length > 0) {
            const lastDate = new Date(uniqueDates[0])
            const diffTime = Math.abs(today.getTime() - lastDate.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays <= 1) {
                consecutive = 1
                let currentDate = lastDate

                for (let i = 1; i < uniqueDates.length; i++) {
                    const prevDate = new Date(uniqueDates[i])
                    const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

                    if (Math.round(dayDiff) === 1) {
                        consecutive++
                        currentDate = prevDate
                    } else {
                        break
                    }
                }
            }
        }

        setStats({
            consecutiveDays: consecutive,
            totalMinutes,
            lastLearningDate: uniqueDates.length > 0 ? new Date(uniqueDates[0]).toLocaleDateString() : ''
        })
    }

    const handleSmartGenerate = async () => {
        // Default to 15 words for smart generate
        const selected = WordSelector.selectWordsForArticle(allWords, 15)
        await generateAndSaveArticle(selected)
    }

    const handleManualGenerate = async (selectedWords: Word[]) => {
        setIsManualDialogOpen(false)
        await generateAndSaveArticle(selectedWords)
    }

    const generateAndSaveArticle = async (words: Word[]) => {
        try {
            // Get settings
            const settings = await settingsService.getSettings()
            if (!settings) {
                setSnackbarMsg('Please configure settings first')
                setSnackbarOpen(true)
                return
            }

            // Generate UUID here to ensure idempotency (prevent double generation)
            const { v4: uuidv4 } = await import('uuid')
            const articleUuid = uuidv4()

            // Navigate immediately to reading page with generation parameters
            navigate('/reading', {
                state: {
                    mode: 'generate',
                    words: words,
                    settings: settings,
                    uuid: articleUuid
                }
            })
        } catch (error) {
            console.error('Failed to navigate to reading page:', error)
            setSnackbarMsg('Failed to navigate. Please try again.')
            setSnackbarOpen(true)
        }
    }

    const handleActivityClick = (item: DashboardActivity) => {
        if (item.type === 'article') {
            navigate(`/read/${item.id}`)
        } else if (item.type === 'quiz' && item.articleId) {
            // Navigate to article page but trigger review mode for this quiz
            navigate(`/read/${item.articleId}`, {
                state: { quizId: item.id }
            })
        }
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 2 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>
                    {t('home:title')}
                </Typography>

                <Grid container spacing={3}>

                    {/* Hero Section */}
                    <Grid item xs={12} lg={8}>
                        <DashboardHero
                            consecutiveDays={stats.consecutiveDays}
                            totalMinutes={stats.totalMinutes}
                            lastLearningDate={stats.lastLearningDate}
                            recommendedWord={recommendedWord}
                            onSmartGenerate={handleSmartGenerate}
                            onManualMode={() => setIsManualDialogOpen(true)}
                        />
                    </Grid>

                    {/* Stats Section */}
                    <Grid item xs={12} lg={4}>
                        <DashboardStats
                            totalWords={allWords.length}
                            masteredCount={statusCounts.Mastered}
                            statusCounts={statusCounts}
                        />
                    </Grid>

                    {/* Recent Activity Section */}
                    <Grid item xs={12}>
                        <RecentActivityList
                            activities={activities}
                            onItemClick={handleActivityClick}
                        />
                    </Grid>
                </Grid>

                <ManualGenerationDialog
                    open={isManualDialogOpen}
                    onClose={() => setIsManualDialogOpen(false)}
                    onGenerate={handleManualGenerate}
                    allWords={allWords}
                />

                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={4000}
                    onClose={() => setSnackbarOpen(false)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert onClose={() => setSnackbarOpen(false)} severity="info" sx={{ width: '100%' }}>
                        {snackbarMsg}
                    </Alert>
                </Snackbar>
            </Box>
        </Container>
    )
}
