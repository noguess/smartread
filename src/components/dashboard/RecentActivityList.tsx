import { Typography, List, ListItem, ListItemText, Chip, Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { History } from '../../services/db'
import { StyledCard } from '../common'

interface RecentActivityListProps {
    history: History[]
}

export default function RecentActivityList({ history }: RecentActivityListProps) {
    const { t } = useTranslation(['home'])

    const getScoreEmoji = (score: number) => {
        if (score >= 90) return '🎉'
        if (score >= 80) return '⭐'
        if (score >= 60) return '👍'
        return '💪'
    }

    return (
        <StyledCard sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📝</span> {t('home:recentActivity.title')}
            </Typography>

            {history.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ fontSize: '3rem', mb: 1, opacity: 0.3 }}>
                        📭
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('home:recentActivity.noActivity')}
                    </Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {history.slice(0, 5).map((item, index) => (
                        <ListItem
                            key={item.id}
                            disableGutters
                            sx={{
                                borderBottom: index < Math.min(5, history.length) - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                                py: 2,
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Typography component="span" sx={{ fontSize: '1.2rem' }}>
                                            {getScoreEmoji(item.userScore)}
                                        </Typography>
                                        <Typography variant="subtitle2" fontWeight="600" sx={{ flex: 1 }}>
                                            {item.title || `文章 #${item.id}`}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Chip
                                            label={`${item.userScore} ${t('home:recentActivity.points')}`}
                                            size="small"
                                            color={item.userScore >= 80 ? 'success' : item.userScore >= 60 ? 'warning' : 'default'}
                                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            🕒 {new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </StyledCard>
    )
}
