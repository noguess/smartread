import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Slider,
    Box,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Paper,
} from '@mui/material'
import { Add, Refresh } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { Word } from '../../services/db'
import { WordSelector } from '../../utils/WordSelector'
import { wordService } from '../../services/wordService'

interface ManualGenerationDialogProps {
    open: boolean
    onClose: () => void
    onGenerate: (selectedWords: Word[]) => void
    allWords: Word[]
}

export default function ManualGenerationDialog({
    open,
    onClose,
    onGenerate,
    allWords = [],
}: ManualGenerationDialogProps) {
    const { t } = useTranslation(['home', 'common'])
    const [wordCount, setWordCount] = useState<number>(15)
    const [selectedWords, setSelectedWords] = useState<Word[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Reset selection when dialog opens
    useEffect(() => {
        if (open) {
            handleAutoFill()
        }
    }, [open])

    const handleAutoFill = () => {
        if (!allWords) return
        const currentCount = selectedWords.length
        if (currentCount < wordCount) {
            const needed = wordCount - currentCount
            // Filter out already selected
            const available = allWords.filter((w) => !selectedWords.find((sw) => sw.id === w.id))
            // Use WordSelector logic but we need to adapt it to pick from specific list
            // For simplicity, let's just use WordSelector on the available pool
            const newPicks = WordSelector.selectWordsForArticle(available, needed)
            setSelectedWords([...selectedWords, ...newPicks])
        } else if (currentCount > wordCount) {
            // If we have too many, trim from the end (assuming end are auto-added)
            setSelectedWords(selectedWords.slice(0, wordCount))
        } else {
            // If equal, maybe we want to refresh?
            // If called explicitly via button, we might want to refresh non-locked words.
            // For simplicity, let's just re-run selection for the whole count if it's a full refresh
            const newPicks = WordSelector.selectWordsForArticle(allWords, wordCount)
            setSelectedWords(newPicks)
        }
    }

    const handleSliderChange = (_: Event, newValue: number | number[]) => {
        setWordCount(newValue as number)
    }

    const handleRemoveWord = (wordId: number) => {
        setSelectedWords(selectedWords.filter((w) => w.id !== wordId))
    }

    const handleAddWord = async () => {
        if (!searchQuery.trim()) return
        // Find word in DB (case insensitive?)
        const word = await wordService.getWordBySpelling(searchQuery.trim())
        if (word) {
            if (!selectedWords.find((w) => w.id === word.id)) {
                setSelectedWords([...selectedWords, word])
            }
            setSearchQuery('')
        } else {
            // Show error or toast? For now just log
            console.log('Word not found')
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t('home:manual.title')}</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 4, mt: 2 }}>
                    <Typography gutterBottom>{t('home:manual.wordCount')}: {wordCount}</Typography>
                    <Slider
                        value={wordCount}
                        onChange={handleSliderChange}
                        onChangeCommitted={handleAutoFill} // Update selection when slider stops
                        min={5}
                        max={50}
                        valueLabelDisplay="auto"
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('home:manual.selectedWords')} ({selectedWords.length})
                        </Typography>
                        <Button
                            startIcon={<Refresh />}
                            size="small"
                            onClick={() => {
                                // Force refresh
                                const newPicks = WordSelector.selectWordsForArticle(allWords, wordCount)
                                setSelectedWords(newPicks)
                            }}
                        >
                            {t('home:manual.autoFill')}
                        </Button>
                    </Box>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            minHeight: 100,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            bgcolor: '#FAFAFA',
                        }}
                    >
                        {selectedWords.map((word) => (
                            <Chip
                                key={word.id}
                                label={word.spelling}
                                onDelete={() => handleRemoveWord(word.id!)}
                                color={word.status === 'New' ? 'primary' : word.status === 'Review' ? 'error' : 'default'}
                                variant={word.status === 'Mastered' ? 'outlined' : 'filled'}
                            />
                        ))}
                        {selectedWords.length === 0 && (
                            <Typography color="text.secondary" sx={{ width: '100%', textAlign: 'center', py: 2 }}>
                                {t('home:manual.noWords')}
                            </Typography>
                        )}
                    </Paper>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={t('home:manual.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleAddWord} edge="end">
                                        <Add />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} color="inherit">
                    {t('common:button.cancel')}
                </Button>
                <Button
                    onClick={() => onGenerate(selectedWords)}
                    variant="contained"
                    size="large"
                    disabled={selectedWords.length === 0}
                >
                    {t('home:manual.generate')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
