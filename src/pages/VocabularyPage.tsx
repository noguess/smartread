import { useState, useEffect, memo } from 'react'
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Grid,
    CardActionArea,
} from '@mui/material'
import { Search as SearchIcon, LibraryBooks as LibraryBooksIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { Word } from '../services/db'
import { wordService } from '../services/wordService'
import WordDetailModal from '../components/WordDetailModal'
import { EmptyState, StyledCard, StatusBadge } from '../components/common'

const WordCard = memo(({ word, onClick }: { word: Word; onClick: (spelling: string) => void }) => (
    <Grid item xs={12} sm={6} md={4} lg={3}>
        <StyledCard hoverable>
            <CardActionArea onClick={() => onClick(word.spelling)} sx={{ height: '100%', p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" component="span">
                            {word.spelling}
                        </Typography>
                        {word.phonetic && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                component="span"
                                sx={{ ml: 1, fontFamily: '"Arial Unicode MS", sans-serif' }}
                            >
                                {word.phonetic}
                            </Typography>
                        )}
                    </Box>
                    <StatusBadge status={word.status} size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {word.meaning}
                </Typography>
            </CardActionArea>
        </StyledCard>
    </Grid>
))

export default function VocabularyPage() {
    const { t } = useTranslation(['vocabulary', 'common'])
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

    const counts = {
        All: words.length,
        New: words.filter(w => w.status === 'New').length,
        Learning: words.filter(w => w.status === 'Learning').length,
        Review: words.filter(w => w.status === 'Review').length,
        Mastered: words.filter(w => w.status === 'Mastered').length,
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LibraryBooksIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h4" fontWeight="bold">
                    {t('vocabulary:title')}
                </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label={t('vocabulary:tabs.all', { count: counts.All })} />
                    <Tab label={t('vocabulary:tabs.new', { count: counts.New })} />
                    <Tab label={t('vocabulary:tabs.learning', { count: counts.Learning })} />
                    <Tab label={t('vocabulary:tabs.review', { count: counts.Review })} />
                    <Tab label={t('vocabulary:tabs.mastered', { count: counts.Mastered })} />
                </Tabs>
            </Box>

            <TextField
                fullWidth
                placeholder={t('vocabulary:searchPlaceholder')}
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

            {filteredWords.length > 0 ? (
                <Grid container spacing={2}>
                    {filteredWords.map((word) => (
                        <WordCard key={word.id} word={word} onClick={handleWordClick} />
                    ))}
                </Grid>
            ) : (
                <EmptyState
                    icon="🔍"
                    title={searchQuery ? t('vocabulary:emptyState.noResults') : t('vocabulary:emptyState.noWords')}
                    description={
                        searchQuery
                            ? t('vocabulary:emptyState.noResultsDesc')
                            : t('vocabulary:emptyState.noWordsDesc')
                    }
                />
            )}

            <WordDetailModal
                word={selectedWord}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </Box>
    )
}
