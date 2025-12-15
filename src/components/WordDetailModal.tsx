import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Chip,
    Paper,
    Tooltip,
} from '@mui/material'
import { Close, PlayArrow, Recommend, OpenInNew, PushPin, PushPinOutlined } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { videoIndexService, VideoOccurrence } from '../services/videoIndexService'
import { wordService } from '../services/wordService'
import { dictionaryService, DictionaryEntry } from '../services/dictionaryService'
import { chineseDictionaryService } from '../services/chineseDictionaryService'
import { getLemma } from '../utils/textUtils'
import { VolumeUp, MenuBook } from '@mui/icons-material'
import { Button, CircularProgress, Snackbar, Alert, AlertColor } from '@mui/material'
import { settingsService } from '../services/settingsService'

interface WordDetailModalProps {
    word: string
    open: boolean
    onClose: () => void
}

export default function WordDetailModal({ word, open, onClose }: WordDetailModalProps) {
    const { t } = useTranslation(['vocabulary', 'common'])
    const [occurrences, setOccurrences] = useState<VideoOccurrence[]>([])
    const [selectedOccurrence, setSelectedOccurrence] = useState<VideoOccurrence | null>(null)
    const [wordData, setWordData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [videoSource, setVideoSource] = useState<'bilibili' | 'youtube'>('youtube')

    // Dictionary & TTS states
    const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[] | null>(null)
    const [loadingDictionary, setLoadingDictionary] = useState(false)
    const [showDictionary, setShowDictionary] = useState(false)

    const [apiError, setApiError] = useState<string | null>(null)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success')

    const listRef = useRef<HTMLUListElement>(null)

    const loadWordData = useCallback(async (wordToLoad: string) => {
        setLoading(true)
        // Reset states
        setDictionaryData(null)
        setShowDictionary(false)

        try {
            // 0. Normalize to Lemma
            const lemma = getLemma(wordToLoad)

            // 1. Try to get word (Lemma) from DB
            let dbWord = await wordService.getWordBySpelling(lemma)

            // Get Settings
            const settings = await settingsService.getSettings()
            const source = settings.videoSource || 'youtube'
            setVideoSource(source)

            // 2. If not found in DB, fetch from Dictionary API and auto-save
            if (!dbWord) {
                try {
                    // Priority 1: Chinese Dictionary (Youdao Proxy)
                    const chineseDef = await chineseDictionaryService.getDefinition(lemma)

                    if (chineseDef) {
                        // Found Chinese Definition
                        dbWord = await saveNewWord(lemma, chineseDef.definition, chineseDef.phonetic)
                        showToast(t('vocabulary:modal.toast.autoAdded', { word: lemma }))
                    } else {
                        // Priority 2: Fallback to English Dictionary
                        const apiData = await dictionaryService.getDefinition(lemma)
                        if (apiData && apiData.length > 0) {
                            setDictionaryData(apiData) // Cache for display
                            // Format English meaning
                            const enMeaning = apiData[0].meanings.slice(0, 2).map(m =>
                                `${m.partOfSpeech}. ${m.definitions[0].definition}`
                            ).join('; ')
                            const enPhonetic = apiData[0].phonetic || apiData[0].phonetics.find(p => p.text)?.text || ''

                            dbWord = await saveNewWord(lemma, enMeaning, enPhonetic)
                            showToast(t('vocabulary:modal.toast.autoAdded', { word: lemma }))
                        }
                    }
                } catch (err) {
                    console.warn('Auto-fetch dictionary failed:', err)
                }
            } else if (dbWord.status === 'New') {
                // Task 2: If word exists but is 'New', upgrade to 'Learning'
                // Note: We are updating the LEMMA's status
                await wordService.updateWordStatus(dbWord.id!, 'Learning', Date.now(), 1)
                dbWord.status = 'Learning' // Update local object
                showToast(t('vocabulary:modal.toast.statusUpdated', { word: lemma }))
            }

            setWordData(dbWord)

            // 3. Search for video occurrences (Use original word for exact context match, or lemma?)
            // Let's use Lemma to find more results, as 'decided' -> 'decide' is likely desired.
            const results = await videoIndexService.searchWord(lemma, source)


            // Sort results: Score DESC, then Page ASC, then Time ASC
            // Sort results: Pinned First, then Score DESC, then Page ASC, then Time ASC
            const sortedResults = sortOccurrences(results, dbWord?.pinnedVideo)

            setOccurrences(sortedResults)

            if (sortedResults.length > 0) {
                // If there is a pinned video, it will be at index 0 due to sort
                setSelectedOccurrence(sortedResults[0])
            } else {
                setSelectedOccurrence(null)
            }
        } catch (error) {
            console.error('Failed to load word data:', error)
        } finally {
            setLoading(false)
        }
    }, [t])

    useEffect(() => {
        if (open && word) {
            loadWordData(word) // Load every time validation opens for a new word
        }
    }, [open, word, loadWordData])

    const showToast = (message: string, severity: AlertColor = 'success') => {
        setSnackbarMessage(message)
        setSnackbarSeverity(severity)
        setSnackbarOpen(true)
    }



    const sortOccurrences = (results: VideoOccurrence[], pinned: any) => {
        return [...results].sort((a, b) => {
            // Pinned video comes first
            if (pinned) {
                const isAPinned = a.bvid === pinned.bvid && a.page === pinned.page && Math.abs(a.startTime - pinned.startTime) < 0.1
                const isBPinned = b.bvid === pinned.bvid && b.page === pinned.page && Math.abs(b.startTime - pinned.startTime) < 0.1
                if (isAPinned && !isBPinned) return -1
                if (isBPinned && !isAPinned) return 1
            }

            const scoreA = a.score || 0
            const scoreB = b.score || 0
            if (scoreA !== scoreB) return scoreB - scoreA
            if (a.page !== b.page) return a.page - b.page
            return a.startTime - b.startTime
        })
    }

    const saveNewWord = async (spelling: string, meaning: string, phonetic?: string) => {
        const newWord = {
            spelling,
            meaning,
            phonetic: phonetic || '',
            status: 'Learning' as const,
            nextReviewAt: Date.now(),
            interval: 1,
            repetitionCount: 0,
            lastSeenAt: Date.now()
        }

        const id = await wordService.addWord(newWord)
        return { ...newWord, id }
    }

    const handleCheckDictionary = async () => {
        setShowDictionary(true)
        if (!dictionaryData && !loadingDictionary) {
            setLoadingDictionary(true)
            setApiError(null)
            try {
                // If we already auto-fetched it in loadWordData but failed to save or something, retry
                // Or if we failed to fetch in loadWordData, we retry here.
                const data = await dictionaryService.getDefinition(word)
                setDictionaryData(data)
            } catch (error) {
                console.error('Failed to load dictionary data', error)
                setApiError(t('vocabulary:modal.error.network'))
            } finally {
                setLoadingDictionary(false)
            }
        }
    }

    const handleSpeak = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word)
            utterance.lang = 'en-US'
            window.speechSynthesis.speak(utterance)
        }
    }

    const handleOccurrenceClick = (occurrence: VideoOccurrence) => {
        setSelectedOccurrence(occurrence)
    }

    const handlePinVideo = async (occurrence: VideoOccurrence, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent selecting the video when clicking pin
        if (!wordData || !wordData.id) return

        const isPinned = wordData.pinnedVideo?.bvid === occurrence.bvid &&
            wordData.pinnedVideo?.page === occurrence.page &&
            Math.abs(wordData.pinnedVideo?.startTime - occurrence.startTime) < 0.1

        let newPinnedVideo: any = undefined
        if (!isPinned) {
            newPinnedVideo = {
                bvid: occurrence.bvid,
                page: occurrence.page,
                startTime: occurrence.startTime
            }
        }

        try {
            await wordService.updateWord(wordData.id, { pinnedVideo: newPinnedVideo })

            // Update local state
            const newWordData = { ...wordData, pinnedVideo: newPinnedVideo }
            setWordData(newWordData)

            // Re-sort occurrences
            const newSorted = sortOccurrences(occurrences, newPinnedVideo)
            setOccurrences(newSorted)

            // If we pinned it, select it immediately? (User UX choice: probably yes)
            if (newPinnedVideo) {
                setSelectedOccurrence(occurrence)
                showToast(t('vocabulary:modal.toast.pinned'))
                // Auto scroll to top to show pinned video
                if (listRef.current) {
                    listRef.current.scrollTo({ top: 0, behavior: 'smooth' })
                }
            } else {
                showToast(t('vocabulary:modal.toast.unpinned'))
            }

        } catch (error) {
            console.error('Failed to update pin status', error)
            showToast(t('vocabulary:modal.error.generic'), 'error')
        }
    }

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h5" fontWeight="bold">
                            {word}
                        </Typography>
                        {wordData && wordData.phonetic && (
                            <Typography variant="h6" color="text.secondary" sx={{ fontFamily: '"Arial Unicode MS", sans-serif' }}>
                                {wordData.phonetic}
                            </Typography>
                        )}
                        <IconButton onClick={handleSpeak} size="small" title={t('vocabulary:modal.speak')}>
                            <VolumeUp />
                        </IconButton>
                        {wordData && (
                            <Chip
                                label={wordData.status}
                                size="small"
                                color={
                                    wordData.status === 'Mastered' ? 'success' :
                                        wordData.status === 'Review' ? 'warning' :
                                            'default'
                                }
                            />
                        )}
                    </Box>
                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    {/* Word Info */}
                    {wordData && (
                        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#F5F5F5' }}>
                            <Typography variant="body1" color="text.secondary">
                                {wordData.meaning}
                            </Typography>
                        </Paper>
                    )}

                    {/* Video Player */}
                    {selectedOccurrence ? (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                {t('vocabulary:modal.videoExplanation')}
                            </Typography>
                            <Box sx={{
                                position: 'relative',
                                paddingBottom: '56.25%', // 16:9 aspect ratio
                                height: 0,
                                overflow: 'hidden',
                                borderRadius: 2,
                                bgcolor: '#000'
                            }}>
                                {videoSource === 'youtube' ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${selectedOccurrence.bvid}?start=${Math.floor(selectedOccurrence.startTime)}&rel=0&autoplay=1`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                ) : (
                                    <iframe
                                        referrerPolicy="no-referrer"
                                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
                                        src={`//player.bilibili.com/player.html?bvid=${selectedOccurrence.bvid}&page=${selectedOccurrence.page}&t=${Math.floor(selectedOccurrence.startTime)}&autoplay=1&danmaku=0`}
                                        scrolling="no"
                                        frameBorder="0"
                                        allowFullScreen={true}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                )}
                            </Box>
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    {t('vocabulary:modal.source')}: {selectedOccurrence.title} (Time: {selectedOccurrence.startTime}s)
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                    href={videoSource === 'youtube'
                                        ? `https://www.youtube.com/watch?v=${selectedOccurrence.bvid}&t=${Math.floor(selectedOccurrence.startTime)}s`
                                        : `https://www.bilibili.com/video/${selectedOccurrence.bvid}?p=${selectedOccurrence.page}&t=${Math.floor(selectedOccurrence.startTime)}`
                                    }
                                    target="_blank"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                >
                                    {videoSource === 'youtube'
                                        ? t('vocabulary:modal.watchOnYoutube', 'YouTube')
                                        : t('vocabulary:modal.watchOnBilibili', 'Bilibili')
                                    }
                                </Button>
                            </Box>

                        </Box>
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                bgcolor: '#FAFAFA',
                                borderRadius: 2,
                                mb: 3,
                            }}
                        >
                            <Typography color="text.secondary">
                                {loading ? t('common:loading') : t('vocabulary:modal.noVideo')}
                            </Typography>
                        </Paper>
                    )}



                    {/* Occurrence List */}
                    {occurrences.length > 1 && (
                        <Box>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                {t('vocabulary:modal.otherOccurrences')} ({occurrences.length})
                            </Typography>
                            <List dense sx={{ maxHeight: 200, overflow: 'auto' }} ref={listRef}>
                                {occurrences.map((occ, index) => (
                                    <ListItem key={index} disablePadding>
                                        <ListItemButton
                                            selected={selectedOccurrence === occ}
                                            onClick={() => handleOccurrenceClick(occ)}
                                        >
                                            <PlayArrow sx={{ mr: 1, fontSize: 20 }} />
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                        <Typography noWrap sx={{ flex: 1 }} variant="body1" component="span" title={occ.title}>
                                                            {occ.title}
                                                        </Typography>
                                                        {isOccurrencePinned(occ, wordData?.pinnedVideo) && (
                                                            <PushPin fontSize="small" color="primary" sx={{ fontSize: 16, flexShrink: 0 }} />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={`P${occ.page} - ${occ.startTime}s - "${occ.context.substring(0, 40)}..."`}
                                            />
                                            {/* Show Recommended Icon for high scores */}
                                            {occ.score && occ.score >= 5 && (
                                                <Tooltip title={t('vocabulary:modal.recommended')}>
                                                    <Recommend color="primary" sx={{ ml: 1, fontSize: 20 }} />
                                                </Tooltip>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handlePinVideo(occ, e)}
                                                sx={{ ml: 1 }}
                                                title={isOccurrencePinned(occ, wordData?.pinnedVideo) ? t('vocabulary:modal.unpin') : t('vocabulary:modal.pin')}
                                            >
                                                {isOccurrencePinned(occ, wordData?.pinnedVideo) ?
                                                    <PushPin fontSize="small" color="primary" /> :
                                                    <PushPinOutlined fontSize="small" color="action" />
                                                }
                                            </IconButton>
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    {/* Dictionary Section */}
                    {showDictionary ? (
                        <Box sx={{ mt: 3, mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MenuBook fontSize="small" /> {t('vocabulary:modal.dictionaryDefinition')}
                            </Typography>
                            {loadingDictionary ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : apiError ? (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {apiError}
                                </Alert>
                            ) : dictionaryData ? (
                                <Box>
                                    {dictionaryData.map((entry, idx) => (
                                        <Box key={idx} sx={{ mb: 2 }}>
                                            {entry.phonetic && (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Arial Unicode MS", sans-serif', mb: 1 }}>
                                                    {entry.phonetic}
                                                </Typography>
                                            )}
                                            {entry.meanings.map((meaning, mIdx) => (
                                                <Box key={mIdx} sx={{ mb: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                                                        {meaning.partOfSpeech}
                                                    </Typography>
                                                    <List dense disablePadding>
                                                        {meaning.definitions.slice(0, 3).map((def, dIdx) => (
                                                            <ListItem key={dIdx} disablePadding sx={{ display: 'block', mb: 1 }}>
                                                                <Typography variant="body2">
                                                                    • {def.definition}
                                                                </Typography>
                                                                {def.example && (
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2, fontStyle: 'italic' }}>
                                                                        "{def.example}"
                                                                    </Typography>
                                                                )}
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Box>
                                            ))}
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {t('vocabulary:modal.noDictionaryData')}
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <Button
                                startIcon={<MenuBook />}
                                onClick={handleCheckDictionary}
                                variant="outlined"
                                size="small"
                            >
                                {t('vocabulary:modal.checkDictionary')}
                            </Button>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    )
}

// Helper to check if an occurrence is pinned
function isOccurrencePinned(occ: VideoOccurrence, pinnedVideo: any) {
    if (!pinnedVideo) return false
    return occ.bvid === pinnedVideo.bvid &&
        occ.page === pinnedVideo.page &&
        Math.abs(occ.startTime - pinnedVideo.startTime) < 0.1
}
