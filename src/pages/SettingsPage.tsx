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
import { settingsService } from '../services/settingsService'
import { db, Setting } from '../services/db'

export default function SettingsPage() {
    const [settings, setSettings] = useState<Setting | null>(null)
    const [apiKey, setApiKey] = useState('')
    const [articleLen, setArticleLen] = useState<'short' | 'medium' | 'long'>('medium')
    const [dailyLimit, setDailyLimit] = useState(10)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMsg, setSnackbarMsg] = useState('')
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [resetPassword, setResetPassword] = useState('')

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
        }
    }

    const handleSave = async () => {
        const newSettings: Setting = {
            id: settings?.id,
            apiKey,
            articleLenPref: articleLen,
            dailyNewLimit: dailyLimit,
        }
        await settingsService.saveSettings(newSettings)
        setSettings(newSettings)
        showToast('Settings saved successfully')
    }

    const handleResetClick = () => {
        setResetPassword('')
        setConfirmDialogOpen(true)
    }

    const handleConfirmReset = async () => {
        // Validate password
        if (resetPassword !== 'admin') {
            showToast('密码错误，请重试')
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

            showToast('学习进度已重置，页面即将刷新...')
            setTimeout(() => {
                window.location.reload()
            }, 1500)
        } catch (error) {
            console.error('Failed to reset progress:', error)
            showToast('重置失败，请重试')
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
                设置
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    API 配置
                </Typography>
                <TextField
                    fullWidth
                    label="Deepseek API Key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    helperText="请输入您的 Deepseek API Key (本地存储，不会上传)"
                    sx={{ mt: 2 }}
                />
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    学习偏好
                </Typography>

                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>文章长度</InputLabel>
                    <Select
                        value={articleLen}
                        label="文章长度"
                        onChange={(e) => setArticleLen(e.target.value as any)}
                    >
                        <MenuItem value="short">短篇 (~150词)</MenuItem>
                        <MenuItem value="medium">中篇 (~250词)</MenuItem>
                        <MenuItem value="long">长篇 (~350+词)</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    label="每日新词上限"
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    helperText="限制每天引入新词的最大数量"
                    sx={{ mt: 2 }}
                />
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    数据管理
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Button variant="outlined" color="error" onClick={handleResetClick}>
                    重置进度
                </Button>
            </Paper>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Button variant="contained" size="large" onClick={handleSave}>
                    保存设置
                </Button>
            </Box>

            <Dialog
                open={confirmDialogOpen}
                onClose={handleCancelReset}
            >
                <DialogTitle>确认重置进度</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        此操作将清除所有学习进度和历史记录，但保留单词数据和用户设置。
                    </DialogContentText>
                    <DialogContentText sx={{ mb: 2, color: 'error.main', fontWeight: 'bold' }}>
                        ⚠️ 此操作无法撤销！
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="请输入密码以确认"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        helperText="提示：密码为 admin"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleConfirmReset()
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelReset}>取消</Button>
                    <Button onClick={handleConfirmReset} color="error" variant="contained">
                        确认重置
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
