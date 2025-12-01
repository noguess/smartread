import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Typography, Container } from '@mui/material'
import { wordService } from '../services/wordService'
import { historyService } from '../services/historyService'
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
    const [allWords, setAllWords] = useState<Word[]>([])
    const [history, setHistory] = useState<History[]>([])
    const [statusCounts, setStatusCounts] = useState<Record<WordStatus, number>>({
        New: 0,
        Learning: 0,
        Review: 0,
        Mastered: 0,
    })
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)

    useEffect(() => {
        loadData()
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
    }

    const handleSmartGenerate = () => {
        // Default to 15 words for smart generate
        const selected = WordSelector.selectWordsForArticle(allWords, 15)
        navigate('/reading', { state: { words: selected } })
    }

    const handleManualGenerate = (selectedWords: Word[]) => {
        setIsManualDialogOpen(false)
        navigate('/reading', { state: { words: selectedWords } })
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
                            reviewCount={statusCounts.Review}
                            newCount={statusCounts.New} // This is total new, maybe we want daily limit?
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
            </Box>
        </Container>
    )
}
