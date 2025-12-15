import { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stepper,
    Step,
    StepLabel,
    Typography,
    Box,
    TextField,
    CircularProgress,
    Link
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { settingsService } from '../../services/settingsService'
import { wordService } from '../../services/wordService'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

interface OnboardingDialogProps {
    open: boolean
    onClose: () => void
}

export default function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
    const { t } = useTranslation(['onboarding', 'common'])
    const [activeStep, setActiveStep] = useState(0)
    const [apiKey, setApiKey] = useState('')
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null)

    const steps = [
        t('onboarding:steps.welcome'),
        t('onboarding:steps.apiKey'),
        t('onboarding:steps.import'),
    ]

    const handleNext = async () => {
        if (activeStep === 1) {
            // Save API Key
            if (!apiKey.trim()) return
            await settingsService.saveSettings({ apiKey: apiKey.trim() })
        }

        if (activeStep === steps.length - 1) {
            // Finish
            await settingsService.saveSettings({ hasCompletedOnboarding: true })
            onClose()
        } else {
            setActiveStep((prev) => prev + 1)
        }
    }

    const handleBack = () => {
        setActiveStep((prev) => prev - 1)
    }

    const handleImport = async () => {
        setImporting(true)
        try {
            const response = await fetch('/cihuibiao/zkgaopinci666.csv')
            if (!response.ok) throw new Error('Failed to fetch vocabulary')

            const csvText = await response.text()
            // Robust splitting for various line endings
            const lines = csvText.split(/\r\n|\n|\r/).filter(line => line.trim() !== '')
            const words: any[] = []

            console.log(`Parsed ${lines.length} lines from CSV`)

            // Start from index 1 to skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i]
                const parts = line.split(',')
                if (parts.length >= 4) {
                    const spelling = parts[1].trim()
                    const phonetic = parts[2].trim()
                    const meaning = parts.slice(3).join(',').trim()
                    if (spelling) {
                        words.push({
                            spelling,
                            phonetic,
                            meaning,
                            status: 'New',
                            nextReviewAt: 0,
                            interval: 0,
                            repetitionCount: 0,
                            lastSeenAt: 0
                        })
                    }
                }
            }

            console.log(`Found ${words.length} valid words to import`)

            if (words.length > 0) {
                const result = await wordService.importWords(words)
                setImportResult(result)
            }
        } catch (error) {
            console.error('Import failed:', error)
        } finally {
            setImporting(false)
        }
    }

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            {t('onboarding:welcome.title')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {t('onboarding:welcome.desc')}
                        </Typography>
                    </Box>
                )
            case 1:
                return (
                    <Box sx={{ py: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {t('onboarding:apiKey.title')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {t('onboarding:apiKey.desc')}
                        </Typography>
                        <TextField
                            fullWidth
                            label={t('onboarding:apiKey.label')}
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={t('onboarding:apiKey.placeholder')}
                            helperText={t('onboarding:apiKey.helper')}
                            error={activeStep === 1 && apiKey.trim() === ''} // Simple validation visual
                            autoFocus
                        />
                        <Box sx={{ mt: 2 }}>
                            <Link href="https://platform.deepseek.com/" target="_blank" rel="noopener">
                                Get Deepseek API Key
                            </Link>
                        </Box>
                    </Box>
                )
            case 2:
                return (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            {t('onboarding:import.title')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {t('onboarding:import.desc')}
                        </Typography>

                        {importResult ? (
                            <Box sx={{ mt: 4, mb: 2 }}>
                                <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 1 }} />
                                <Typography variant="h6">
                                    {t('onboarding:import.success', { count: importResult.added })}
                                </Typography>
                                {importResult.skipped > 0 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        ({t('onboarding:import.skipped', { count: importResult.skipped })})
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{ mt: 4, mb: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleImport}
                                    disabled={importing}
                                    startIcon={importing ? <CircularProgress size={20} color="inherit" /> : null}
                                >
                                    {importing ? t('common:loading') : t('onboarding:import.button')}
                                </Button>
                            </Box>
                        )}
                    </Box>
                )
            default:
                return null
        }
    }

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, p: 1 }
            }}
        >
            <DialogTitle>
                {t('onboarding:title')}
            </DialogTitle>
            <DialogContent>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ minHeight: '200px', mt: 2 }}>
                    {renderStepContent(activeStep)}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                >
                    {t('onboarding:actions.back')}
                </Button>
                <Box>
                    {activeStep === 2 && !importResult && (
                        <Button onClick={handleNext} sx={{ mr: 1 }}>
                            {t('onboarding:import.skip')}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={activeStep === 1 && !apiKey.trim()}
                    >
                        {activeStep === steps.length - 1 ? t('onboarding:actions.finish') : t('onboarding:actions.next')}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    )
}
