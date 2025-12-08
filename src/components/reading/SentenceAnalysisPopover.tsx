import { useState } from 'react'
import {
    Popover,
    Typography,
    Box,
    CircularProgress,
    Button,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material'
import { Close, Translate, AutoFixHigh, Circle } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { llmService } from '../../services/llmService'
import { Setting } from '../../services/db'

interface SentenceAnalysisPopoverProps {
    sentence: string
    anchorPosition: { top: number; left: number } | null
    onClose: () => void
    settings: Setting
}

interface AnalysisResult {
    translation: string
    grammar: string[]
}

export default function SentenceAnalysisPopover({
    sentence,
    anchorPosition,
    onClose,
    settings
}: SentenceAnalysisPopoverProps) {
    const { t } = useTranslation(['common'])
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const [error, setError] = useState(false)

    const handleAnalyze = async () => {
        setLoading(true)
        setError(false)
        try {
            const data = await llmService.analyzeSentence(sentence, settings)
            setResult(data)
        } catch (err) {
            console.error('Sentence analysis failed:', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    const open = Boolean(anchorPosition)
    if (!open) return null

    return (
        <Popover
            open={open}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition || undefined}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            PaperProps={{
                sx: {
                    width: 360,
                    p: 2,
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    maxHeight: 400,
                    overflowY: 'auto'
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                    {t('status.sentenceAnalysis', 'Sentence Analysis')}
                </Typography>
                <IconButton size="small" onClick={onClose}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            <Typography
                variant="body2"
                color="text.primary"
                sx={{
                    fontStyle: 'italic',
                    mb: 2,
                    borderLeft: '3px solid #1976d2',
                    pl: 1.5,
                    opacity: 0.9
                }}
            >
                "{sentence.length > 80 ? sentence.substring(0, 80) + '...' : sentence}"
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {!result && !loading && !error && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                        {t('msg.clickToAnalyze', 'Click to analyze grammar & translation')}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AutoFixHigh />}
                        onClick={handleAnalyze}
                        sx={{ borderRadius: 6, px: 3 }}
                    >
                        {t('button.analyze', 'Analyze')}
                    </Button>
                </Box>
            )}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                </Box>
            )}

            {error && (
                <Typography color="error" variant="body2" align="center" sx={{ py: 2 }}>
                    {t('common:error', 'Analysis failed. Please try again.')}
                </Typography>
            )}

            {result && (
                <Box sx={{ animation: 'fadeIn 0.3s ease-in' }}>
                    {/* Translation */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Translate fontSize="inherit" />
                            {t('label.translation', 'Translation')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {result.translation}
                        </Typography>
                    </Box>

                    {/* Grammar */}
                    <Box>
                        <Typography variant="caption" color="secondary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <AutoFixHigh fontSize="inherit" />
                            {t('label.grammar', 'Grammar Points')}
                        </Typography>
                        <List dense disablePadding>
                            {result.grammar.map((point, index) => (
                                <ListItem key={index} disablePadding sx={{ mb: 1, alignItems: 'flex-start' }}>
                                    <ListItemIcon sx={{ minWidth: 20, mt: 0.5 }}>
                                        <Circle sx={{ fontSize: 6, color: 'text.secondary' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={point}
                                        primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Box>
            )}
        </Popover>
    )
}
