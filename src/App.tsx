import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ReadingPage from './pages/ReadingPage'
import HistoryPage from './pages/HistoryPage'
import VocabularyPage from './pages/VocabularyPage'
import StatisticsPage from './pages/StatisticsPage'
import SettingsPage from './pages/SettingsPage'
import { seedDatabase } from './services/db'

// Material Design 3 theme with Deep Blue/Teal
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#006064', // Deep Teal
        },
        secondary: {
            main: '#0277BD', // Deep Blue
        },
        background: {
            default: '#FAFAFA',
            paper: '#FFFEF7', // Cream/Off-white for reading
        },
        error: {
            main: '#D32F2F', // Red for errors/urgent reviews
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    },
})

function App() {
    useEffect(() => {
        const initDB = async () => {
            await seedDatabase()
        }
        initDB()
    }, [])

    return (
        <ThemeProvider theme={theme}>
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
        </ThemeProvider>
    )
}

export default App
