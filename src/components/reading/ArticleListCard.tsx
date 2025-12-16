import React from 'react'
import {
    Box,
    Typography,
    Button,
    IconButton,
    Chip,
    useTheme
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
import { BaseListCard } from '../common'
import { LevelColors } from '../../theme/constants'
import { formatDate } from '../../utils/formatting'

// Local interface to decouple, or import from a shared type file if one existed.
export interface ArticleCardProps {
    article: Article & {
        quizCount: number
        highestScore: number
    }
    onRead: (article: any) => void
    onDelete?: (article: any) => void
}

const ArticleListCard: React.FC<ArticleCardProps> = ({ article, onRead, onDelete }) => {
    const { t } = useTranslation(['library', 'common'])
    const theme = useTheme()

    const levelStyle = LevelColors[article.difficultyLevel] || { bg: theme.palette.grey[100], text: theme.palette.grey[700], color: 'default' }

    // Date formatting
    const dateStr = formatDate(article.createdAt)

    // Prepare slots for BaseListCard

    // Badge: Difficulty Chip
    const badge = (
        <Chip
            label={article.difficultyLevel}
            size="small"
            sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 'bold',
                borderRadius: 10,
                bgcolor: levelStyle.bg,
                color: levelStyle.text,
                border: 'none'
            }}
        />
    )

    // Metadata: Date + Target Words
    const metadata = (
        <>
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
                            bgcolor: 'grey.50',
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
        </>
    )

    // Stats: Quiz Count + Score
    const stats = (
        <>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: 'grey.50', px: 1, py: 0.5, borderRadius: 1
            }}>
                <FileTextIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    {article.quizCount} {t('library:card.test_count', '次测试')}
                </Typography>
            </Box>

            {article.highestScore != null && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    bgcolor: 'warning.50', px: 1, py: 0.5, borderRadius: 1
                }}>
                    <TrophyIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, color: 'warning.dark' }}>
                        {t('library:card.best_score_prefix', '最佳')}: {article.highestScore}
                    </Typography>
                </Box>
            )}
        </>
    )

    // Actions: Read Button + Delete
    const actions = (
        <>
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
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(article)
                    }}
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
        </>
    )

    return (
        <BaseListCard
            icon={<BookIcon />}
            title={article.title}
            onTitleClick={() => onRead(article)}
            badge={badge}
            iconBoxColor={{ bg: levelStyle.bg, color: levelStyle.text }}
            metadata={metadata}
            stats={stats}
            actions={actions}
        // Add click to card body if desired, though title click is explicit
        // Original code didn't have whole-card click, only title and button.
        // But let's verify if original had...
        // Original: no whole card click handler, but hover effect existed.
        // onTitleClick handles the navigation.
        />
    )
}

export default ArticleListCard
