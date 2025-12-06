import { Typography, List, ListItem, ListItemText, Chip, Box, Avatar } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { StyledCard } from '../common'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import QuizIcon from '@mui/icons-material/Quiz'

export interface DashboardActivity {
    id: string | number
    type: 'article' | 'quiz'
    title: string
    date: number
    score?: number
    difficultyLevel?: string
}

interface RecentActivityListProps {
    activities: DashboardActivity[]
}

export default function RecentActivityList({ activities }: RecentActivityListProps) {
    const { t, i18n } = useTranslation(['home'])

    const getScoreEmoji = (score: number) => {
        if (score >= 90) return '🎉'
        if (score >= 80) return '⭐'
        if (score >= 60) return '👍'
        return '💪'
    }

    const getActivityIcon = (type: 'article' | 'quiz', score?: number) => {
        if (type === 'article') {
            return (
                <Avatar sx={{ bgcolor: 'secondary.light', width: 40, height: 40 }}>
                    <AutoStoriesIcon sx={{ color: 'secondary.contrastText' }} />
                </Avatar>
            )
        }
        return (
            <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                {score !== undefined ? (
                    <Typography fontSize="1.2rem">{getScoreEmoji(score)}</Typography>
                ) : (
                    <QuizIcon sx={{ color: 'primary.contrastText' }} />
                )}
            </Avatar>
        )
    }

    return (
        <StyledCard sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📝</span> {t('home:recentActivity.title')}
            </Typography>

            {activities.length === 0 ? (
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
                    {activities.slice(0, 5).map((item, index) => (
                        <ListItem
                            key={`${item.type}-${item.id}`}
                            disableGutters
                            sx={{
                                borderBottom: index < Math.min(5, activities.length) - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                                py: 2,
                                gap: 2
                            }}
                        >
                            {getActivityIcon(item.type, item.score)}

                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Typography variant="subtitle2" fontWeight="600" sx={{ flex: 1 }}>
                                            {item.title}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Chip
                                            label={item.type === 'quiz'
                                                ? `${item.score} ${t('home:recentActivity.points')}`
                                                : item.difficultyLevel || 'L2'
                                            }
                                            size="small"
                                            color={
                                                item.type === 'quiz'
                                                    ? (item.score! >= 80 ? 'success' : item.score! >= 60 ? 'warning' : 'default')
                                                    : 'secondary'
                                            }
                                            variant={item.type === 'article' ? 'outlined' : 'filled'}
                                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {item.type === 'article' ? 'Created on' : 'Quiz on'} {new Date(item.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
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
