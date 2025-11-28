import { useState, useEffect, useRef } from 'react'
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
} from '@mui/material'
import { Close, PlayArrow } from '@mui/icons-material'
import { videoIndexService, VideoOccurrence } from '../services/videoIndexService'
import { wordService } from '../services/wordService'

interface WordDetailModalProps {
    word: string
    open: boolean
    onClose: () => void
}

export default function WordDetailModal({ word, open, onClose }: WordDetailModalProps) {
    const [occurrences, setOccurrences] = useState<VideoOccurrence[]>([])
    const [selectedOccurrence, setSelectedOccurrence] = useState<VideoOccurrence | null>(null)
    const [wordData, setWordData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [videoError, setVideoError] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (open && word) {
            loadWordData()
        }
    }, [open, word])

    const loadWordData = async () => {
        setLoading(true)
        setVideoError(false)

        try {
            // Load word from database
            const dbWord = await wordService.getWordBySpelling(word.toLowerCase())
            setWordData(dbWord)

            // Search for video occurrences
            const results = await videoIndexService.searchWord(word)
            setOccurrences(results)

            if (results.length > 0) {
                setSelectedOccurrence(results[0]) // Auto-select first
            }
        } catch (error) {
            console.error('Failed to load word data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOccurrenceClick = (occurrence: VideoOccurrence) => {
        setSelectedOccurrence(occurrence)
        setVideoError(false)

        // Jump to timestamp when video is ready
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, occurrence.startTime - 0.5)
            videoRef.current.play().catch(e => console.log('Autoplay prevented'))
        }
    }

    const handleVideoLoadedMetadata = () => {
        if (videoRef.current && selectedOccurrence) {
            videoRef.current.currentTime = Math.max(0, selectedOccurrence.startTime - 0.5)
        }
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
                            Video Explanation
                        </Typography>
                        {!videoError ? (
                            <video
                                ref={videoRef}
                                key={selectedOccurrence.videoPath}
                                controls
                                style={{ width: '100%', borderRadius: '8px', backgroundColor: '#000' }}
                                onError={() => setVideoError(true)}
                                onLoadedMetadata={handleVideoLoadedMetadata}
                            >
                                <source src={`/${selectedOccurrence.videoPath}`} type="video/mp4" />
                            </video>
                        ) : (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    bgcolor: '#FAFAFA',
                                    borderRadius: 2,
                                }}
                            >
                                <Typography color="text.secondary">
                                    Video not available
                                </Typography>
                            </Paper>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Context: "{selectedOccurrence.context}"
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
                            {loading ? 'Loading...' : 'No video explanation available for this word'}
                        </Typography>
                    </Paper>
                )}

                {/* Occurrence List */}
                {occurrences.length > 1 && (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            Other Occurrences ({occurrences.length})
                        </Typography>
                        <List dense>
                            {occurrences.map((occ, index) => (
                                <ListItem key={index} disablePadding>
                                    <ListItemButton
                                        selected={selectedOccurrence === occ}
                                        onClick={() => handleOccurrenceClick(occ)}
                                    >
                                        <PlayArrow sx={{ mr: 1, fontSize: 20 }} />
                                        <ListItemText
                                            primary={`Video ${index + 1}`}
                                            secondary={`${occ.startTime.toFixed(1)}s - "${occ.context.substring(0, 50)}..."`}
                                        />
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
