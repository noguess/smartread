import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ReadingPage from './pages/ReadingPage'
import LibraryPage from './pages/LibraryPage'
import VocabularyPage from './pages/VocabularyPage'
import StatisticsPage from './pages/StatisticsPage'
import SettingsPage from './pages/SettingsPage'
import { ThemeProvider as CustomThemeProvider, useThemeMode } from './theme/ThemeContext'
import { themes } from './theme'
import PageTransition from './components/common/PageTransition'

function AnimatedRoutes() {
    const location = useLocation()

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                    <PageTransition>
                        <HomePage />
                    </PageTransition>
                } />
                <Route path="/reading" element={
                    <PageTransition>
                        <ReadingPage />
                    </PageTransition>
                } />
                <Route path="/read/:id" element={
                    <PageTransition>
                        <ReadingPage />
                    </PageTransition>
                } />
                <Route path="/library" element={
                    <PageTransition>
                        <LibraryPage />
                    </PageTransition>
                } />
                <Route path="/vocabulary" element={
                    <PageTransition>
                        <VocabularyPage />
                    </PageTransition>
                } />
                <Route path="/statistics" element={
                    <PageTransition>
                        <StatisticsPage />
                    </PageTransition>
                } />
                <Route path="/settings" element={
                    <PageTransition>
                        <SettingsPage />
                    </PageTransition>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    )
}

import { migrateV1ToV2 } from './services/migrationService'

function AppContent() {
    const { themeMode } = useThemeMode()

    useEffect(() => {
        // Run database migration
        migrateV1ToV2()
    }, [])

    return (
        <MuiThemeProvider theme={themes[themeMode]}>
            <Layout>
                <AnimatedRoutes />
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
