import { useState, useEffect, useCallback } from 'react'
import {
    Popover,
    Typography,
    Box,
    CircularProgress,
    Button,
    IconButton,
    Divider,
    Drawer,
    useMediaQuery,
    useTheme
} from '@mui/material'
import { VolumeUp, School, Close } from '@mui/icons-material'
import { dictionaryService, DictionaryEntry } from '../../services/dictionaryService'
import { wordService } from '../../services/wordService'
import { chineseDictionaryService } from '../../services/chineseDictionaryService'
import { getLemma } from '../../utils/textUtils'
import { useTranslation } from 'react-i18next'

interface DefinitionPopoverProps {
    word: string
    anchorPosition: { top: number; left: number } | null
    onClose: () => void
    onDeepDive: (word: string) => void
}

type DefinitionData =
    | { type: 'simple'; definition: string; phonetic: string; sourceWord: string }
    | { type: 'complex'; entry: DictionaryEntry; sourceWord: string }

export default function DefinitionPopover({
    word,
    anchorPosition,
    onClose,
    onDeepDive
}: DefinitionPopoverProps) {
    const { t } = useTranslation(['vocabulary', 'common'])
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<DefinitionData | null>(null)
    const [error, setError] = useState(false)

    const open = Boolean(anchorPosition)

    const loadEnglishDict = useCallback(async () => {
        const results = await dictionaryService.getDefinition(word)
        if (results && results?.length > 0) {
            setData({ type: 'complex', entry: results[0], sourceWord: word })
        } else {
            setError(true)
        }
    }, [word])

    const loadDefinition = useCallback(async () => {
        setLoading(true)
        setData(null)
        setError(false)
        try {
            // 1. Check Local DB (Instant) - Word itself
            let localWord = await wordService.getWordBySpelling(word)
            let usedWord = word

            // 1b. Check Local DB - Lemma (Base form)
            if (!localWord) {
                const lemma = getLemma(word)
                if (lemma && lemma !== word.toLowerCase()) {
                    const lemmaWord = await wordService.getWordBySpelling(lemma)
                    if (lemmaWord) {
                        localWord = lemmaWord
                        usedWord = lemma
                    }
                }
            }

            if (localWord) {
                setData({
                    type: 'simple',
                    definition: localWord.meaning,
                    phonetic: localWord.phonetic || '',
                    sourceWord: usedWord
                })
                setLoading(false)
                return
            }

            // 2. Use Free Chinese Dictionary (Proxy)
            const chineseDef = await chineseDictionaryService.getDefinition(word)
            if (chineseDef) {
                setData({
                    type: 'simple',
                    definition: chineseDef.definition,
                    phonetic: chineseDef.phonetic || '', // API might not return phonetic
                    sourceWord: word
                })
                setLoading(false)
                return
            }

            // 3. Fallback to English Dictionary
            await loadEnglishDict()

        } catch (err) {
            console.warn('Failed to fetch definition for popover:', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [word, loadEnglishDict])

    useEffect(() => {
        if (open && word) {
            loadDefinition()
        }
    }, [open, word, loadDefinition])

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation()
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word)
            utterance.lang = 'en-US'
            window.speechSynthesis.speak(utterance)
        }
    }

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    if (!anchorPosition) return null

    const phonetic = data?.type === 'simple' ? data.phonetic : data?.type === 'complex' ? data.entry.phonetic : null

    const Content = (
        <Box sx={{ p: isMobile ? 3 : 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                        {word}
                    </Typography>
                    {phonetic && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Arial Unicode MS"', mt: 0.5 }}>
                            {phonetic}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={handleSpeak}>
                        <VolumeUp fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={onClose}>
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ minHeight: 60 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 60 }}>
                        <CircularProgress size={20} />
                    </Box>
                ) : error ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                        {t('vocabulary:modal.noDictionaryData', 'No definition found')}
                    </Typography>
                ) : data ? (
                    <Box>
                        {data.type === 'simple' ? (
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {data.definition}
                            </Typography>
                        ) : (
                            // Complex (English Dictionary) View
                            <Box>
                                {data.entry.meanings.slice(0, 2).map((m, i) => (
                                    <Box key={i} sx={{ mb: 1 }}>
                                        <Typography variant="caption" sx={{ fontStyle: 'italic', fontWeight: 'bold', color: 'primary.main', mr: 1 }}>
                                            {m.partOfSpeech}
                                        </Typography>
                                        <Typography variant="body2" component="span">
                                            {m.definitions[0].definition}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                ) : null}
            </Box>

            <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<School />}
                onClick={() => onDeepDive(data?.sourceWord || word)}
                sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
            >
                {t('common:button.study', 'Deep Dive')}
            </Button>
        </Box>
    )

    if (isMobile) {
        return (
            <Drawer
                anchor="bottom"
                open={Boolean(anchorPosition)}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        borderRadius: '16px 16px 0 0',
                        maxHeight: '50vh'
                    }
                }}
            >
                {Content}
            </Drawer>
        )
    }

    return (
        <Popover
            open={Boolean(anchorPosition)}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition || undefined}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            PaperProps={{
                sx: {
                    width: 320,
                    p: 2,
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }
            }}
            disableRestoreFocus
        >
            {Content}
        </Popover>
    )
}
