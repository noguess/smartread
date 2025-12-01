import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ReadingPage from './pages/ReadingPage'
import HistoryPage from './pages/HistoryPage'
import VocabularyPage from './pages/VocabularyPage'
import StatisticsPage from './pages/StatisticsPage'
import SettingsPage from './pages/SettingsPage'
import { seedDatabase } from './services/db'
import { ThemeProvider as CustomThemeProvider, useThemeMode } from './theme/ThemeContext'
import { themes } from './theme'

function AppContent() {
    const { themeMode } = useThemeMode()

    useEffect(() => {
        const initDB = async () => {
            await seedDatabase()
        }
        initDB()
    }, [])

    return (
        <MuiThemeProvider theme={themes[themeMode]}>
            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/reading" element={<ReadingPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/vocabulary" element={<VocabularyPage />} />
                    <Route path="/statistics" element={<StatisticsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </MuiThemeProvider>
    )
}

function App() {
    return (
        <CustomThemeProvider>
            <AppContent />
        </CustomThemeProvider>
    )
}

export default App
