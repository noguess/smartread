import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Paper,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Divider,
    Snackbar,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { settingsService } from '../services/settingsService'
import { db, Setting } from '../services/db'
import { wordService } from '../services/wordService'
import ThemeSwitcher from '../components/ThemeSwitcher'

export default function SettingsPage() {
    const { t } = useTranslation(['settings', 'common'])
    const [settings, setSettings] = useState<Setting | null>(null)
    const [apiKey, setApiKey] = useState('')
    const [articleLen, setArticleLen] = useState<'short' | 'medium' | 'long'>('medium')
    const [dailyLimit, setDailyLimit] = useState(10)
    const [difficultyLevel, setDifficultyLevel] = useState<'L1' | 'L2' | 'L3'>('L2')
    const [videoSource, setVideoSource] = useState<'bilibili' | 'youtube'>('youtube')
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMsg, setSnackbarMsg] = useState('')
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [resetPassword, setResetPassword] = useState('')
    const [importResultOpen, setImportResultOpen] = useState(false)
    const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        const current = await settingsService.getSettings()
        if (current) {
            setSettings(current)
            setApiKey(current.apiKey)
            setArticleLen(current.articleLenPref)
            setDailyLimit(current.dailyNewLimit)
            setDifficultyLevel(current.difficultyLevel || 'L2')
            setVideoSource(current.videoSource || 'youtube')
        }
    }

    const handleSave = async () => {
        const newSettings: Setting = {
            id: settings?.id,
            apiKey,
            articleLenPref: articleLen,
            dailyNewLimit: dailyLimit,
            difficultyLevel: difficultyLevel,
            videoSource: videoSource,
        }
        await settingsService.saveSettings(newSettings)
        setSettings(newSettings)
        showToast(t('settings:messages.saveSuccess'))
    }

    const handleResetClick = () => {
        setResetPassword('')
        setConfirmDialogOpen(true)
    }

    const handleConfirmReset = async () => {
        // Validate password
        if (resetPassword !== 'admin') {
            showToast(t('settings:messages.wrongPassword'))
            return
        }

        setConfirmDialogOpen(false)

        try {
            // Reset all words learning progress
            await db.transaction('rw', db.words, db.history, async () => {
                // Reset word learning data but keep basic data (spelling, phonetic, meaning)
                await db.words.toCollection().modify(word => {
                    word.status = 'New'
                    word.nextReviewAt = 0
                    word.interval = 0
                    word.repetitionCount = 0
                    word.lastSeenAt = 0
                })

                // Clear all history
                await db.history.clear()
            })

            showToast(t('settings:messages.resetSuccess'))
            setTimeout(() => {
                window.location.reload()
            }, 1500)
        } catch (error) {
            console.error('Failed to reset progress:', error)
            showToast(t('settings:messages.resetError'))
        }
    }

    const [importing, setImporting] = useState(false)

    const handleImportWords = async () => {
        setImporting(true)
        try {
            const response = await fetch('/cihuibiao/zkgaopinci666.csv')
            if (!response.ok) throw new Error('Failed to fetch vocabulary')

            const csvText = await response.text()
            const lines = csvText.split('\n').filter(line => line.trim() !== '')
            const words: any[] = []

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

            if (words.length > 0) {
                const result = await wordService.importWords(words)
                setImportResult(result)
                setImportResultOpen(true)
            }
        } catch (error) {
            console.error('Import failed:', error)
            showToast(t('settings:messages.importError'))
        } finally {
            setImporting(false)
        }
    }

    const handleCancelReset = () => {
        setConfirmDialogOpen(false)
        setResetPassword('')
    }

    const showToast = (msg: string) => {
        setSnackbarMsg(msg)
        setSnackbarOpen(true)
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                {t('settings:title')}
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {t('settings:api.title')}
                </Typography>
                <TextField
                    fullWidth
                    label={t('settings:api.apiKey')}
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    helperText={t('settings:api.apiKeyHelper')}
                    sx={{ mt: 2 }}
                />
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {t('settings:preferences.title')}
                </Typography>

                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>{t('settings:preferences.articleLength')}</InputLabel>
                    <Select
                        value={articleLen}
                        label={t('settings:preferences.articleLength')}
                        onChange={(e) => setArticleLen(e.target.value as any)}
                    >
                        <MenuItem value="short">{t('settings:preferences.short')}</MenuItem>
                        <MenuItem value="medium">{t('settings:preferences.medium')}</MenuItem>
                        <MenuItem value="long">{t('settings:preferences.long')}</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    label={t('settings:preferences.dailyLimit')}
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    helperText={t('settings:preferences.dailyLimitHelper')}
                    sx={{ mt: 2 }}
                />

                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>{t('settings:preferences.difficultyLevel')}</InputLabel>
                    <Select
                        value={difficultyLevel}
                        label={t('settings:preferences.difficultyLevel')}
                        onChange={(e) => setDifficultyLevel(e.target.value as any)}
                    >
                        <MenuItem value="L1">L1 - {t('settings:preferences.difficultyL1')}</MenuItem>
                        <MenuItem value="L2">L2 - {t('settings:preferences.difficultyL2')}</MenuItem>
                        <MenuItem value="L3">L3 - {t('settings:preferences.difficultyL3')}</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>{t('settings:preferences.videoSource')}</InputLabel>
                    <Select
                        value={videoSource}
                        label={t('settings:preferences.videoSource')}
                        onChange={(e) => setVideoSource(e.target.value as any)}
                    >
                        <MenuItem value="bilibili">{t('settings:preferences.videoSourceBilibili')}</MenuItem>
                        <MenuItem value="youtube">{t('settings:preferences.videoSourceYoutube')}</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {/* V2.0: 主题模式切换 */}
            <ThemeSwitcher />

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {t('settings:data.title')}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {t('settings:data.importTitle')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('settings:data.importDesc')}
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={handleImportWords}
                            disabled={importing}
                        >
                            {importing ? t('common:loading') : t('settings:data.importButton')}
                        </Button>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" color="error">
                                {t('settings:data.resetTitle')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('settings:data.resetDesc')}
                            </Typography>
                        </Box>
                        <Button variant="outlined" color="error" onClick={handleResetClick}>
                            {t('settings:data.reset')}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Button variant="contained" size="large" onClick={handleSave}>
                    {t('settings:saveSettings')}
                </Button>
            </Box>

            <Dialog
                open={confirmDialogOpen}
                onClose={handleCancelReset}
            >
                <DialogTitle>{t('settings:resetDialog.title')}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {t('settings:resetDialog.description')}
                    </DialogContentText>
                    <DialogContentText sx={{ mb: 2, color: 'error.main', fontWeight: 'bold' }}>
                        {t('settings:resetDialog.warning')}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('settings:resetDialog.passwordLabel')}
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        helperText={t('settings:resetDialog.passwordHint')}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleConfirmReset()
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelReset}>{t('common:button.cancel')}</Button>
                    <Button onClick={handleConfirmReset} color="error" variant="contained">
                        {t('settings:resetDialog.confirmButton')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={importResultOpen}
                onClose={() => setImportResultOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('settings:importDialog.title')}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {t('settings:importDialog.description')}
                    </DialogContentText>
                    {importResult && (
                        <Box sx={{ mt: 2, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                ✅ {t('settings:importDialog.added')}: <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}>{importResult.added}</Box>
                            </Typography>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                ⏭️ {t('settings:importDialog.skipped')}: <Box component="span" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>{importResult.skipped}</Box>
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setImportResultOpen(false)} variant="contained" size="large">
                        {t('settings:importDialog.confirmButton')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </Box>
    )
}
