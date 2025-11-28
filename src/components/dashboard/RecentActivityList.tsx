import { Paper, Typography, List, ListItem, ListItemText, Chip, Box } from '@mui/material'
import { History } from '../../services/db'

interface RecentActivityListProps {
    history: History[]
}

export default function RecentActivityList({ history }: RecentActivityListProps) {
    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
                Recent Activity
            </Typography>

            {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No recent articles. Start learning!
                </Typography>
            ) : (
                <List disablePadding>
                    {history.slice(0, 5).map((item) => (
                        <ListItem
                            key={item.id}
                            disableGutters
                            sx={{
                                borderBottom: '1px solid #f0f0f0',
                                '&:last-child': { borderBottom: 'none' },
                                py: 2,
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        {item.title || `Article #${item.id}`}
                                    </Typography>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip
                                            label={`Score: ${item.userScore}`}
                                            size="small"
                                            color={item.userScore >= 80 ? 'success' : 'warning'}
                                            variant="outlined"
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                            {new Date(item.date).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    )
}
