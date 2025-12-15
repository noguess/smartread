import { useState, useEffect, useCallback } from 'react'
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
    Paper,
    Autocomplete
} from '@mui/material'
import { Refresh } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { Word } from '../../services/db'
import { WordSelector } from '../../utils/WordSelector'

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

    const handleAutoFill = useCallback(() => {
        if (!allWords) return
        const currentCount = selectedWords.length
        if (currentCount < wordCount) {
            const needed = wordCount - currentCount
            // Filter out already selected
            const available = allWords.filter((w) => !selectedWords.find((sw) => sw.id === w.id))
            // Use WordSelector logic but we need to adapt it to pick from specific list
            // For simplicity, let's just use WordSelector on the available pool
            const newPicks = WordSelector.selectWordsForArticle(available, needed)
            setSelectedWords(prev => [...prev, ...newPicks])
        } else if (currentCount > wordCount) {
            // If we have too many, trim from the end (assuming end are auto-added)
            setSelectedWords(prev => prev.slice(0, wordCount))
        } else {
            // If equal, maybe we want to refresh?
            // If called explicitly via button, we might want to refresh non-locked words.
            // For simplicity, let's just re-run selection for the whole count if it's a full refresh
            const newPicks = WordSelector.selectWordsForArticle(allWords, wordCount)
            setSelectedWords(newPicks)
        }
    }, [allWords, selectedWords, wordCount])

    // Reset selection when dialog opens
    useEffect(() => {
        if (open) {
            handleAutoFill()
        }
    }, [open, handleAutoFill])

    const handleSliderChange = (_: Event, newValue: number | number[]) => {
        setWordCount(newValue as number)
    }

    const handleRemoveWord = (wordId: number) => {
        setSelectedWords(selectedWords.filter((w) => w.id !== wordId))
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
                    <Autocomplete
                        fullWidth
                        size="small"
                        freeSolo
                        options={allWords.filter(w => !selectedWords.find(sw => sw.id === w.id))}
                        getOptionLabel={(option: string | Word) => typeof option === 'string' ? option : option.spelling}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder={t('home:manual.searchPlaceholder')}
                            />
                        )}
                        onChange={(_event: any, newValue: string | Word | null) => {
                            if (newValue && typeof newValue !== 'string') {
                                setSelectedWords([...selectedWords, newValue])
                            }
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
