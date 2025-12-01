import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Chip,
    Box,
    Divider,
} from '@mui/material'
import { History as HistoryIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { History } from '../services/db'
import { historyService } from '../services/historyService'
import { EmptyState, StyledCard } from '../components/common'

export default function HistoryPage() {
    const { t } = useTranslation(['history', 'common'])
    const navigate = useNavigate()
    const [history, setHistory] = useState<History[]>([])

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        const data = await historyService.getHistory()
        setHistory(data)
    }

    const handleItemClick = (record: History) => {
        navigate('/reading', { state: { historyRecord: record, mode: 'review' } })
    }

    const getScoreEmoji = (score: number) => {
        if (score >= 90) return '🎉'
        if (score >= 80) return '⭐'
        if (score >= 60) return '👍'
        return '💪'
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <HistoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h4" fontWeight="bold">
                    📚 {t('history:title')}
                </Typography>
            </Box>

            {history.length === 0 ? (
                <EmptyState
                    icon="📖"
                    title={t('history:emptyState.title')}
                    description={t('history:emptyState.description')}
                />
            ) : (
                <StyledCard>
                    <List disablePadding>
                        {history.map((record, index) => (
                            <Box key={record.id || index}>
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => handleItemClick(record)}
                                        sx={{
                                            py: 2.5,
                                            px: 3,
                                            '&:hover': {
                                                bgcolor: 'action.hover',
                                            },
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Typography component="span" sx={{ fontSize: '1.5rem' }}>
                                                            {getScoreEmoji(record.userScore)}
                                                        </Typography>
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                {record.title || 'Untitled Article'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                🕒 {new Date(record.date).toLocaleDateString('zh-CN')} {new Date(record.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Chip
                                                        label={`${record.userScore} ${t('history:points')}`}
                                                        color={record.userScore >= 80 ? 'success' : record.userScore >= 60 ? 'warning' : 'error'}
                                                        size="small"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            mb: 1.5,
                                                            lineHeight: 1.6,
                                                        }}
                                                    >
                                                        {record.articleContent}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                                                            🎯 {t('history:targetWords')}:
                                                        </Typography>
                                                        {record.targetWords.slice(0, 5).map((word) => (
                                                            <Chip
                                                                key={word}
                                                                label={word}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                                            />
                                                        ))}
                                                        {record.targetWords.length > 5 && (
                                                            <Chip
                                                                label={`+${record.targetWords.length - 5}`}
                                                                size="small"
                                                                variant="filled"
                                                                color="primary"
                                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                                {index < history.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                </StyledCard>
            )}
        </Container>
    )
}
