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

            {/* 1. Action Card (Start Quiz) - Visual Reduced Noise Version */}
            <Paper
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    border: '2px solid', // Increased border width
                    borderColor: 'primary.lighter', // Use theme color or custom
                    borderRadius: 4,
                    p: 3,
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        borderColor: 'primary.light',
                    },
                    // Group hover effect simulation via class or just simple hover
                    '&:hover .decorative-circle': {
                        transform: 'scale(1.1)'
                    }
                }}
            >
                {/* Decorative Circle from read.html */}
                <Box
                    className="decorative-circle"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'primary.lighter',
                        opacity: 0.5,
                        mr: -5,
                        mt: -5,
                        transition: 'transform 0.3s ease'
                    }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="700" color="text.primary">
                            {t('reading:sidebar.startQuiz', 'Start Quiz')}
                        </Typography>
                        <Box sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.lighter',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Trophy sx={{ fontSize: 16, color: 'primary.main' }} />
                        </Box>
                    </Stack>

                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 3, display: 'block' }}>
                        {t('reading:sidebar.quizStats', { count: attemptCount, score: bestScore })}
                    </Typography>

                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={onStartQuiz}
                        endIcon={<ArrowRight sx={{ fontSize: 16 }} />}
                        sx={{
                            borderRadius: 3,
                            fontWeight: 'bold',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06)', // shadow-sm/md tailored
                            py: 1.2,
                            textTransform: 'none',
                            fontSize: '0.875rem',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.1), 0 4px 6px -2px rgba(79, 70, 229, 0.05)'
                            },
                            '&:active': {
                                transform: 'scale(0.98)'
                            }
                        }}
                    >
                        {t('reading:sidebar.challengeNow', 'Challenge Now')}
                    </Button>
                </Box>
            </Paper>

            {/* 2. Core Vocabulary List (Scrollable) */}
            <Paper
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider', // border-slate-100
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
                    borderColor: 'divider', // border-slate-50
                    bgcolor: 'background.paper', // reverted to white as per read.html
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Highlighter sx={{ fontSize: 14, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                            {t('reading:sidebar.coreVocabulary', 'Core Vocabulary')}
                        </Typography>
                    </Stack>
                    <Box sx={{
                        bgcolor: 'action.hover', // slate-100
                        color: 'text.secondary', // slate-500
                        px: 1,
                        py: 0.2, // py-0.5
                        borderRadius: 1, // rounded-md
                        fontSize: '0.65rem', // text-[10px]
                        fontWeight: 500
                    }}>
                        {words.length}
                    </Box>
                </Box>

                <Box
                    sx={{
                        flex: 1, // Ensure it fills remaining space in flex container
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
                                className="group" // For child hover effects
                                sx={{
                                    p: 1.5,
                                    mb: 0.5,
                                    borderRadius: 3, // rounded-xl
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    border: '1px solid',
                                    borderColor: activeWord === word.spelling ? 'primary.light' : 'transparent',
                                    bgcolor: activeWord === word.spelling ? 'primary.lighter' : 'background.paper',
                                    transform: activeWord === word.spelling ? 'translateX(4px)' : 'none', // translate-x-1
                                    boxShadow: activeWord === word.spelling ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                                    '&:hover': {
                                        bgcolor: activeWord === word.spelling ? 'primary.lighter' : 'action.hover',
                                        borderColor: activeWord === word.spelling ? 'primary.light' : 'divider',
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight="700"
                                            color={activeWord === word.spelling ? 'primary.main' : 'text.primary'}
                                        >
                                            {word.spelling}
                                        </Typography>
                                        {/* Type/Pos tag hidden by default, shown on hover */}
                                        {ctx?.part_of_speech && (
                                            <Box
                                                component="span"
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    fontStyle: 'italic',
                                                    fontFamily: 'serif',
                                                    color: 'text.secondary',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s',
                                                    '.group:hover &': {
                                                        opacity: 1
                                                    }
                                                }}
                                            >
                                                {ctx.part_of_speech}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                    display="block"
                                    sx={{
                                        '.group:hover &': {
                                            color: 'text.primary'
                                        }
                                    }}
                                >
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
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    flexShrink: 0
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="text.secondary" // slate-400
                        sx={{
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                        }}
                    >
                        <History sx={{ fontSize: 12 }} />
                        {t('reading:sidebar.recentHistory', 'Recent History')}
                    </Typography>
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
                                p: 1, // p-1.5
                                borderRadius: 2, // rounded-lg
                                cursor: 'pointer',
                                transition: 'colors 0.2s',
                                '&:hover': { bgcolor: 'action.hover' } // hover:bg-slate-50
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                                <span>{new Date(record.date).toLocaleDateString()}</span>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography
                                    variant="body2"
                                    fontWeight="bold"
                                    sx={{
                                        color: record.score >= 80 ? 'success.main' :
                                            record.score >= 60 ? 'text.secondary' : 'error.main' // slate-600 logic from read.html
                                    }}
                                >
                                    {record.score}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '10px' }}>
                                    分
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
