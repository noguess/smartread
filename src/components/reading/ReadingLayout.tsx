import { ReactNode } from 'react'
import { Container, Grid, Box, Fade } from '@mui/material'
import ReadingHeader from './ReadingHeader'
import { ReadingSidebar } from './ReadingSidebars'
import { Word, QuizRecord, WordStudyItem } from '../../services/db'

interface ReadingLayoutProps {
    title: string
    fontSize: number
    onFontSizeChange: (size: number) => void
    targetWords: Word[]
    activeWord: string | null
    onHoverWord: (word: string | null) => void
    quizHistory: QuizRecord[]
    onStartQuiz: () => void
    onReviewQuiz: (record: QuizRecord) => void
    onTimerToggle: () => void
    isTimerRunning: boolean
    seconds: number
    onTimerReset: () => void
    wordContexts?: WordStudyItem[]
    children: ReactNode
    sidebarVisible?: boolean
    onWordScroll?: (word: string) => void
    headerVisible?: boolean
    showFontControls?: boolean
}

export default function ReadingLayout({
    title,
    fontSize,
    onFontSizeChange,
    targetWords,
    activeWord,
    onHoverWord,
    quizHistory,
    onStartQuiz,
    onReviewQuiz,
    onTimerToggle,
    isTimerRunning,
    seconds,
    onTimerReset,
    wordContexts,
    children,
    sidebarVisible = true,
    onWordScroll,
    headerVisible = true,
    showFontControls = true
}: ReadingLayoutProps) {
    // TODO: Implement timer display here or pass it down?
    // For now, adhering to interface.

    return (
        <Fade in timeout={500}>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
                {/* 1. Header (Sticky) - Controlled by headerVisible (default true) */}
                {headerVisible && (
                    <ReadingHeader
                        title={title}
                        fontSize={fontSize}
                        onFontSizeChange={onFontSizeChange}
                        isTimerRunning={isTimerRunning}
                        seconds={seconds}
                        onTimerToggle={onTimerToggle}
                        onTimerReset={onTimerReset}
                        showFontControls={showFontControls}
                    />
                )}

                {/* 2. Main Grid Layout */}
                <Container maxWidth="xl" sx={{ mt: 3 }}>
                    <Grid container spacing={4} justifyContent={!sidebarVisible ? 'center' : 'flex-start'}>
                        {/* LEFT: Main Content (Article or Quiz) */}
                        <Grid item xs={12} lg={sidebarVisible ? 9 : 12} md={sidebarVisible ? 9 : 12}>
                            {children}
                        </Grid>

                        {/* RIGHT: Sidebar (Desktop Only for now, or Stacked) */}
                        {sidebarVisible && (
                            <Grid item xs={12} lg={3} sx={{ display: { xs: 'none', lg: 'block' } }}>
                                <ReadingSidebar
                                    words={targetWords}
                                    activeWord={activeWord}
                                    onHoverWord={onHoverWord}
                                    quizHistory={quizHistory}
                                    onStartQuiz={onStartQuiz}
                                    onReviewQuiz={onReviewQuiz}
                                    wordContexts={wordContexts}
                                    onWordClick={onWordScroll}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Container>
            </Box>
        </Fade>
    )
}
