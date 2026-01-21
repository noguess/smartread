import { useEffect, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
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
import QuizHistoryPage from './features/history/QuizHistoryPage'
import QuizResultPage from './features/history/QuizResultPage'
import PageTransition from './components/common/PageTransition'
import { ErrorBoundary } from 'react-error-boundary'
import { PageError } from './components/common'
import NotFoundPage from './pages/NotFoundPage'

const SpeechTestPageWrapper = lazy(() => import('./pages/SpeechTestPage'))
const DrillSelectionPage = lazy(() => import('./features/drill/DrillSelectionPage'))
const DrillProcessPage = lazy(() => import('./features/drill/DrillProcessPage'))
const DrillExamPage = lazy(() => import('./features/drill/DrillExamPage'))



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
                <Route path="/reading/*" element={
                    <PageTransition>
                        <ReadingPage />
                    </PageTransition>
                } />
                <Route path="/read/:articleId/*" element={
                    <PageTransition>
                        <ReadingPage />
                    </PageTransition>
                }>
                    <Route path="quiz/:recordId" element={null} />
                    <Route path="result/:recordId" element={null} />
                </Route>

                {/* Temporary Test Route */}
                <Route path="/speech-test" element={<SpeechTestPageWrapper />} />

                {/* Daily Word Drill */}
                <Route path="/drill/selection" element={
                    <PageTransition>
                        <DrillSelectionPage />
                    </PageTransition>
                } />
                <Route path="/drill/process" element={
                    <PageTransition>
                        <DrillProcessPage />
                    </PageTransition>
                } />
                <Route path="/drill/exam" element={
                    <PageTransition>
                        <DrillExamPage />
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
                <Route path="/history" element={
                    <PageTransition>
                        <QuizHistoryPage />
                    </PageTransition>
                } />
                <Route path="/history/:id" element={
                    <PageTransition>
                        <QuizResultPage />
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
                <Route path="*" element={<NotFoundPage />} />
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
            <ErrorBoundary FallbackComponent={PageError}>
                <Layout>
                    <AnimatedRoutes />
                </Layout>
            </ErrorBoundary>
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
