import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Container,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Chip,
    Box,
    Divider,
} from '@mui/material'
import { History } from '../services/db'
import { historyService } from '../services/historyService'

export default function HistoryPage() {
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

    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
                阅读历史
            </Typography>

            {history.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        暂无阅读记录，快去生成文章开始学习吧！
                    </Typography>
                </Paper>
            ) : (
                <Paper>
                    <List disablePadding>
                        {history.map((record, index) => (
                            <Box key={record.id || index}>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => handleItemClick(record)} sx={{ py: 2 }}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {record.title || 'Untitled Article'}
                                                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                                            {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </Typography>
                                                    <Chip
                                                        label={`得分: ${record.userScore}`}
                                                        color={record.userScore >= 60 ? 'success' : 'error'}
                                                        size="small"
                                                        variant="outlined"
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
                                                            mb: 1
                                                        }}
                                                    >
                                                        {record.articleContent}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        {record.targetWords.slice(0, 5).map((word) => (
                                                            <Chip key={word} label={word} size="small" sx={{ fontSize: '0.75rem' }} />
                                                        ))}
                                                        {record.targetWords.length > 5 && (
                                                            <Chip label={`+${record.targetWords.length - 5}`} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
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
                </Paper>
            )}
        </Container>
    )
}
