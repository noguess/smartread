import { Box, Paper, Typography, Button, Stack } from '@mui/material'
import {
    Highlight as Highlighter,
    EmojiEvents as Trophy,
    ArrowForward as ArrowRight,
    History
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { Word, QuizRecord, WordStudyItem } from '../../services/db'

interface ReadingSidebarProps {
    words: Word[]
    activeWord: string | null
    onHoverWord: (word: string | null) => void
    quizHistory: QuizRecord[]
    onStartQuiz: () => void
    onReviewQuiz: (record: QuizRecord) => void
    wordContexts?: WordStudyItem[]
}

export const ReadingSidebar = ({
    words,
    activeWord,
    onHoverWord,
    quizHistory,
    onStartQuiz,
    onReviewQuiz,
    wordContexts = []
}: ReadingSidebarProps) => {
    const { t } = useTranslation(['reading', 'common'])

    const completedQuizzes = quizHistory.filter(r => r.score !== undefined) as (QuizRecord & { score: number })[]
    const bestScore = completedQuizzes.length > 0
        ? Math.max(...completedQuizzes.map(r => {
            // Force type erasure to handle runtime anomalies
            const rawScore = (r as any).score
            const s = Number(rawScore)
            // console.log(`Debug Score ID ${r.id}:`, rawScore, typeof rawScore, 'Parsed:', s)
            return isNaN(s) ? 0 : s
        }))
        : 0
    const attemptCount = completedQuizzes.length

    // Create helper map for context lookup
    const contextMap = new Map(wordContexts.map(item => [item.word.toLowerCase(), item]))

    return (
        <Box sx={{ position: 'sticky', top: 96, display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 'calc(100vh - 120px)' }}>

            {/* 1. Action Card (Start Quiz) */}
            <Paper
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3, // Reduced from 4
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0
                }}
            >
                {/* Decorative Circle - Subtle */}
                <Box sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%)', // Indigo-100 to Fuchsia-100
                    opacity: 0.6
                }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} sx={{ position: 'relative' }}>
                    <Typography variant="h6" fontWeight="700" color="text.primary">
                        {t('reading:sidebar.startQuiz', 'Start Quiz')}
                    </Typography>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#f5f3ff', // violet-50
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main'
                    }}>
                        <Trophy fontSize="small" />
                    </Box>
                </Stack>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, display: 'block', position: 'relative' }}>
                    {t('reading:sidebar.quizStats', { count: attemptCount, score: bestScore })}
                </Typography>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={onStartQuiz}
                    endIcon={<ArrowRight />}
                    sx={{
                        borderRadius: 2, // Reduced from 3
                        fontWeight: 'bold',
                        textTransform: 'none',
                        bgcolor: 'primary.main',
                        py: 1.2,
                        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06)',
                        '&:hover': {
                            bgcolor: 'primary.dark',
                            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.1), 0 4px 6px -2px rgba(79, 70, 229, 0.05)'
                        }
                    }}
                >
                    {t('reading:sidebar.challengeNow', 'Challenge Now')}
                </Button>
            </Paper>

            {/* 2. Core Vocabulary List (Scrollable) */}
            <Paper
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 3, // Reduced from 4
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1, // Take remaining space
                    minHeight: 0 // Allow flex shrink
                }}
            >
                <Box sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Highlighter fontSize="small" sx={{ color: '#6366f1' }} />
                        <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                            {t('reading:sidebar.coreVocabulary', 'Core Vocabulary')}
                        </Typography>
                    </Stack>
                    <Box sx={{
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        px: 1,
                        py: 0.2,
                        borderRadius: 10,
                        fontSize: '0.75rem',
                        fontWeight: 700
                    }}>
                        {words.length}
                    </Box>
                </Box>

                <Box
                    sx={{
                        p: 1,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: 'divider' }
                    }}
                >
                    {words.map((word) => {
                        const ctx = contextMap.get(word.spelling.toLowerCase())
                        const displayMeaning = ctx?.meaning_in_context || word.meaning
                        return (
                            <Box
                                key={word.id}
                                onMouseEnter={() => onHoverWord(word.spelling)}
                                onMouseLeave={() => onHoverWord(null)}
                                sx={{
                                    p: 1.5,
                                    mb: 0.5,
                                    borderRadius: 2, // Reduced from 3
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    border: '1px solid',
                                    borderColor: activeWord === word.spelling ? 'primary.light' : 'transparent',
                                    bgcolor: activeWord === word.spelling ? 'primary.lighter' : 'transparent',
                                    '&:hover': {
                                        bgcolor: activeWord === word.spelling ? 'primary.lighter' : 'action.hover',
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                        <Typography variant="body2" fontWeight="700" color={activeWord === word.spelling ? 'primary.main' : 'text.primary'}>
                                            {word.spelling}
                                        </Typography>
                                        {word.phonetic && (
                                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                {word.phonetic}
                                            </Typography>
                                        )}
                                    </Box>
                                    {ctx?.part_of_speech && (
                                        <Box
                                            component="span"
                                            sx={{
                                                fontSize: '0.65rem',
                                                bgcolor: 'action.focus', // or grey.200
                                                color: 'text.secondary',
                                                px: 0.8,
                                                py: 0.2,
                                                borderRadius: 10,
                                                // ml: 1 
                                            }}
                                        >
                                            {ctx.part_of_speech}
                                        </Box>
                                    )}
                                </Box>
                                <Typography variant="caption" color="text.secondary" noWrap display="block">
                                    {displayMeaning}
                                </Typography>
                            </Box>
                        )
                    })}
                </Box>
            </Paper>

            {/* 3. History List (Bottom, Fixed Height or Shrinkable) */}
            <Paper
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 3, // Reduced from 4
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    flexShrink: 0
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        {t('reading:sidebar.recentHistory', 'Recent History')}
                    </Typography>
                    <History fontSize="small" sx={{ color: '#94a3b8' }} />
                </Stack>

                <Stack spacing={1}>
                    {completedQuizzes.slice(0, 2).map((record) => (
                        <Box
                            key={record.id}
                            onClick={() => onReviewQuiz(record)}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 1,
                                borderRadius: 2,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                {new Date(record.date).toLocaleDateString()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography
                                    variant="body2"
                                    fontWeight="bold"
                                    sx={{
                                        color: record.score >= 80 ? 'success.main' :
                                            record.score >= 60 ? 'warning.main' : 'error.main'
                                    }}
                                >
                                    {record.score}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                    {completedQuizzes.length === 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            {t('reading:sidebar.noHistory', 'No records')}
                        </Typography>
                    )}
                </Stack>

                {completedQuizzes.length > 2 && (
                    <Button
                        fullWidth
                        size="small"
                        sx={{ mt: 1, fontSize: '0.75rem', color: 'primary.main' }}
                    >
                        {t('reading:sidebar.viewAll', 'View All')}
                    </Button>
                )}
            </Paper>
        </Box>
    )
}
