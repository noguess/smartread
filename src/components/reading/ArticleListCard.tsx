import React from 'react'
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Chip,
    Stack,
    useTheme,
    alpha
} from '@mui/material'
import {
    MenuBook as BookIcon,
    CalendarToday as CalendarIcon,
    Description as FileTextIcon,
    EmojiEvents as TrophyIcon,
    ChevronRight as ChevronRightIcon,
    DeleteOutline as DeleteIcon
} from '@mui/icons-material'
import { Article } from '../../services/db'
import { useTranslation } from 'react-i18next'

// Local interface to decouple, or import from a shared type file if one existed.
// Matching the structure used in LibraryPage
export interface ArticleCardProps {
    article: Article & {
        quizCount: number
        highestScore: number
    }
    onRead: (article: any) => void
    onDelete?: (article: any) => void
}

const LevelColors: Record<string, { bg: string, text: string, color: 'success' | 'info' | 'error' | 'warning' }> = {
    'L1': { bg: '#ECFDF5', text: '#047857', color: 'success' }, // Emerald-100 / Emerald-700
    'L2': { bg: '#EFF6FF', text: '#1D4ED8', color: 'info' },    // Blue-100 / Blue-700
    'L3': { bg: '#FFF1F2', text: '#BE123C', color: 'error' },    // Rose-100 / Rose-700
}

const ArticleListCard: React.FC<ArticleCardProps> = ({ article, onRead, onDelete }) => {
    const { t } = useTranslation(['library', 'common'])
    const theme = useTheme()

    const levelStyle = LevelColors[article.difficultyLevel] || { bg: theme.palette.grey[100], text: theme.palette.grey[700], color: 'default' }

    // Date formatting
    const dateStr = new Date(article.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.100',
                transition: 'all 0.3s',
                '&:hover': {
                    boxShadow: theme.shadows[2],
                    borderColor: 'primary.100', // mimic indigo-100
                },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 3,
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Left: Icon Box */}
            <Box sx={{ flexShrink: 0 }}>
                <Box
                    sx={{
                        width: { xs: 56, sm: 64 },
                        height: { xs: 56, sm: 64 },
                        borderRadius: 4, // rounded-2xl
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(levelStyle.bg, 0.5),
                        color: levelStyle.text,
                    }}
                >
                    <BookIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                </Box>
            </Box>

            {/* Middle: Content */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                {/* Header: Title + Level */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                                fontWeight: 700,
                                color: 'text.primary',
                                lineHeight: 1.2,
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                '&:hover': { color: 'primary.main', cursor: 'pointer' }
                            }}
                            onClick={() => onRead(article)}
                        >
                            {article.title}
                        </Typography>

                        <Chip
                            label={article.difficultyLevel}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                borderRadius: 10, // Full rounded
                                bgcolor: levelStyle.bg,
                                color: levelStyle.text,
                                border: 'none'
                            }}
                        />
                    </Box>
                </Box>

                {/* Metadata Row: Date & Tags */}
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 14 }} />
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{dateStr}</Typography>
                    </Box>

                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'grey.300', display: { xs: 'none', sm: 'block' } }} />

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', overflow: 'hidden' }}>
                        {article.targetWords?.slice(0, 3).map((tag, idx) => (
                            <Typography
                                key={idx}
                                component="span"
                                sx={{
                                    px: 1, py: 0.25,
                                    borderRadius: 1,
                                    bgcolor: 'grey.50', // slate-100
                                    color: 'text.secondary',
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {tag}
                            </Typography>
                        ))}
                        {(article.targetWords?.length || 0) > 3 && (
                            <Typography variant="caption" color="text.disabled" fontWeight="medium">
                                +{(article.targetWords?.length || 0) - 3}
                            </Typography>
                        )}
                    </Box>
                </Stack>

                {/* Stats Row */}
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: 'grey.50', px: 1, py: 0.5, borderRadius: 1
                    }}>
                        <FileTextIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            {/* fallback if validation fails, ensure we check t function return */}
                            {article.quizCount} {t('library:card.test_count', '次测试')}
                        </Typography>
                    </Box>

                    {article.highestScore != null && ( // Check for null/undefined
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            bgcolor: 'warning.50', px: 1, py: 0.5, borderRadius: 1 // amber-50
                        }}>
                            <TrophyIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                            <Typography variant="caption" sx={{ fontWeight: 500, color: 'warning.dark' }}>
                                {t('library:card.best_score_prefix', '最佳')}: {article.highestScore}
                            </Typography>
                        </Box>
                    )}
                </Stack>

            </Box>

            {/* Right: Actions */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'row', sm: 'column' },
                    alignItems: { xs: 'center', sm: 'flex-end' },
                    justifyContent: { xs: 'space-between', sm: 'center' },
                    gap: 1.5,
                    borderTop: { xs: '1px solid', sm: 'none' },
                    borderColor: 'grey.100',
                    pt: { xs: 2, sm: 0 }
                }}
            >
                <Button
                    variant="contained"
                    color="primary"
                    disableElevation
                    endIcon={<ChevronRightIcon />}
                    onClick={() => onRead(article)}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        flex: { xs: 1, sm: 'none' }
                    }}
                >
                    {t('library:card.read', '开始阅读')}
                </Button>

                {onDelete && (
                    <IconButton
                        onClick={() => onDelete(article)}
                        aria-label="delete"
                        sx={{
                            color: 'text.disabled',
                            '&:hover': {
                                color: 'error.main',
                                bgcolor: 'error.50'
                            },
                            borderRadius: 2,
                        }}
                    >
                        <DeleteIcon />
                    </IconButton>
                )}
            </Box>
        </Paper>
    )
}

export default ArticleListCard
