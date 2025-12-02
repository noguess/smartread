import { useState, useEffect } from 'react'
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
import { Close, PlayArrow, Recommend } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { videoIndexService, VideoOccurrence } from '../services/videoIndexService'
import { wordService } from '../services/wordService'

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

    useEffect(() => {
        if (open && word) {
            loadWordData()
        }
    }, [open, word])

    const loadWordData = async () => {
        setLoading(true)
        try {
            // Load word from database
            const dbWord = await wordService.getWordBySpelling(word.toLowerCase())
            setWordData(dbWord)

            // Search for video occurrences
            // Search for video occurrences
            const results = await videoIndexService.searchWord(word)

            // Sort results: Score DESC, then Page ASC, then Time ASC
            results.sort((a, b) => {
                // 1. Score DESC (Higher score first)
                const scoreA = a.score || 0
                const scoreB = b.score || 0
                if (scoreA !== scoreB) {
                    return scoreB - scoreA
                }

                // 2. Page ASC
                if (a.page !== b.page) {
                    return a.page - b.page
                }

                // 3. Time ASC
                return a.startTime - b.startTime
            })

            setOccurrences(results)

            if (results.length > 0) {
                setSelectedOccurrence(results[0]) // Auto-select first
            } else {
                setSelectedOccurrence(null)
            }
        } catch (error) {
            console.error('Failed to load word data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOccurrenceClick = (occurrence: VideoOccurrence) => {
        setSelectedOccurrence(occurrence)
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                        {word}
                    </Typography>
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
                            <iframe
                                src={`//player.bilibili.com/player.html?bvid=${selectedOccurrence.bvid}&page=${selectedOccurrence.page}&t=${Math.floor(selectedOccurrence.startTime)}&high_quality=1&autoplay=1`}
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
                        </Box>
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                {t('vocabulary:modal.source')}: {selectedOccurrence.title} (P{selectedOccurrence.page})
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', borderLeft: '3px solid #1976d2', pl: 1 }}>
                            "{selectedOccurrence.context}"
                        </Typography>
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
                        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                            {occurrences.map((occ, index) => (
                                <ListItem key={index} disablePadding>
                                    <ListItemButton
                                        selected={selectedOccurrence === occ}
                                        onClick={() => handleOccurrenceClick(occ)}
                                    >
                                        <PlayArrow sx={{ mr: 1, fontSize: 20 }} />
                                        <ListItemText
                                            primary={occ.title}
                                            secondary={`P${occ.page} - ${occ.startTime}s - "${occ.context.substring(0, 40)}..."`}
                                        />
                                        {/* Show Recommended Icon for high scores */}
                                        {occ.score && occ.score >= 5 && (
                                            <Tooltip title={t('vocabulary:modal.recommended') || "Recommended"}>
                                                <Recommend color="primary" sx={{ ml: 1, fontSize: 20 }} />
                                            </Tooltip>
                                        )}
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    )
}
