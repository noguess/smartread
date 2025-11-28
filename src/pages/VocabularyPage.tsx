import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Paper,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Grid,
    Card,
    Chip,
    CardActionArea,
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { Word } from '../services/db'
import { wordService } from '../services/wordService'
import WordDetailModal from '../components/WordDetailModal'

export default function VocabularyPage() {
    const [words, setWords] = useState<Word[]>([])
    const [filteredWords, setFilteredWords] = useState<Word[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [tabValue, setTabValue] = useState(0)
    const [selectedWord, setSelectedWord] = useState('')
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        loadWords()
    }, [])

    useEffect(() => {
        filterWords()
    }, [words, searchQuery, tabValue])

    const loadWords = async () => {
        const allWords = await wordService.getAllWords()
        setWords(allWords)
    }

    const filterWords = () => {
        let result = words

        // Filter by Tab (Status)
        const statusMap = ['All', 'New', 'Learning', 'Review', 'Mastered']
        const currentStatus = statusMap[tabValue]

        if (currentStatus !== 'All') {
            result = result.filter(w => w.status === currentStatus)
        }

        // Filter by Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(w => w.spelling.toLowerCase().includes(query))
        }

        setFilteredWords(result)
    }

    const handleWordClick = (word: string) => {
        setSelectedWord(word)
        setModalOpen(true)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Mastered': return 'success'
            case 'Review': return 'warning'
            case 'Learning': return 'info'
            default: return 'default'
        }
    }

    const counts = {
        All: words.length,
        New: words.filter(w => w.status === 'New').length,
        Learning: words.filter(w => w.status === 'Learning').length,
        Review: words.filter(w => w.status === 'Review').length,
        Mastered: words.filter(w => w.status === 'Mastered').length,
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                单词本
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label={`All (${counts.All})`} />
                    <Tab label={`New (${counts.New})`} />
                    <Tab label={`Learning (${counts.Learning})`} />
                    <Tab label={`Review (${counts.Review})`} />
                    <Tab label={`Mastered (${counts.Mastered})`} />
                </Tabs>
            </Box>

            <TextField
                fullWidth
                placeholder="搜索单词..."
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            <Grid container spacing={2}>
                {filteredWords.map((word) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={word.id}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardActionArea onClick={() => handleWordClick(word.spelling)} sx={{ height: '100%', p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        {word.spelling}
                                    </Typography>
                                    <Chip
                                        label={word.status}
                                        size="small"
                                        color={getStatusColor(word.status) as any}
                                        variant="outlined"
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {word.meaning}
                                </Typography>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {filteredWords.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center', minHeight: 200, bgcolor: 'transparent' }} elevation={0}>
                    <Typography variant="body1" color="text.secondary">
                        没有找到符合条件的单词
                    </Typography>
                </Paper>
            )}

            <WordDetailModal
                word={selectedWord}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </Box>
    )
}
