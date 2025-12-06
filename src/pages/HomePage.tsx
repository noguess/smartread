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
import RecentActivityList from '../components/dashboard/RecentActivityList'
import ManualGenerationDialog from '../components/dashboard/ManualGenerationDialog'
import { useTranslation } from 'react-i18next'

export default function HomePage() {
    const { t } = useTranslation(['home'])
    const navigate = useNavigate()
    const location = useLocation()
    const [allWords, setAllWords] = useState<Word[]>([])
    const [history, setHistory] = useState<History[]>([])
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
        setAllWords(words)
        setHistory(hist)

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
        calculateStats(hist)

        // Select Recommended Word (Prioritize Review > Learning > New)
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

    const calculateStats = (hist: History[]) => {
        if (!hist || hist.length === 0) {
            setStats({ consecutiveDays: 0, totalMinutes: 0, lastLearningDate: '' })
            return
        }

        // Sort by date descending
        const sorted = [...hist].sort((a, b) => b.date - a.date)

        // Total Minutes (Estimate 5 mins per article if timeSpent is missing)
        const totalSeconds = sorted.reduce((acc, curr) => acc + (curr.timeSpent || 300), 0)
        const totalMinutes = Math.floor(totalSeconds / 60)

        // Consecutive Days
        let consecutive = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get unique dates from history
        const uniqueDates = Array.from(new Set(sorted.map(h => {
            const d = new Date(h.date)
            d.setHours(0, 0, 0, 0)
            return d.getTime()
        }))).sort((a, b) => b - a) // Descending

        if (uniqueDates.length > 0) {
            const lastDate = new Date(uniqueDates[0])
            const diffTime = Math.abs(today.getTime() - lastDate.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            // If last learning was today or yesterday, start counting
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

            // Navigate immediately to reading page with generation parameters
            navigate('/reading', {
                state: {
                    mode: 'generate',
                    words: words,
                    settings: settings
                }
            })
        } catch (error) {
            console.error('Failed to navigate to reading page:', error)
            setSnackbarMsg('Failed to navigate. Please try again.')
            setSnackbarOpen(true)
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
                    <Grid item xs={12} md={8}>
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
                    <Grid item xs={12} md={4}>
                        <DashboardStats
                            totalWords={allWords.length}
                            masteredCount={statusCounts.Mastered}
                            statusCounts={statusCounts}
                        />
                    </Grid>

                    {/* Recent Activity Section */}
                    <Grid item xs={12}>
                        <RecentActivityList history={history} />
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
