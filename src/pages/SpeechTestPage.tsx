import React, { useState } from 'react'
import { Box, Button, Typography, Paper, Stack, Divider } from '@mui/material'
import { speechService, SpeechLang } from '../services/speechService'

const SpeechTestPage: React.FC = () => {
    const [transcript, setTranscript] = useState('')
    const [status, setStatus] = useState('Idle')
    const [lang, setLang] = useState<SpeechLang>('en-US')

    const startListening = () => {
        setStatus('Listening...')
        setTranscript('')

        speechService.startListening(
            lang,
            (result) => {
                setTranscript(result.transcript)
                if (result.isFinal) {
                    setStatus('Finished')
                }
            },
            (error) => {
                setStatus(`Error: ${error}`)
            }
        )
    }

    const stopListening = () => {
        speechService.stopListening()
        setStatus('Stopped')
    }

    return (
        <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>Speech Service Test</Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                <Button
                    variant={lang === 'en-US' ? 'contained' : 'outlined'}
                    onClick={() => setLang('en-US')}
                >
                    English (US)
                </Button>
                <Button
                    variant={lang === 'zh-CN' ? 'contained' : 'outlined'}
                    onClick={() => setLang('zh-CN')}
                >
                    Chinese (CN)
                </Button>
            </Stack>

            <Paper sx={{ p: 4, minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" color={status.startsWith('Error') ? 'error' : 'primary'}>
                    Status: {status}
                </Typography>

                <Typography variant="body1" sx={{ fontSize: '1.5rem', textAlign: 'center' }}>
                    {transcript || "(Speak now...)"}
                </Typography>

                <Divider sx={{ width: '100%', my: 2 }} />

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={startListening}
                    >
                        Start Mic
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={stopListening}
                    >
                        Stop
                    </Button>
                </Stack>
            </Paper>

            <Typography variant="caption" sx={{ display: 'block', mt: 4, color: 'text.secondary' }}>
                Note: This uses the browser's Web Speech API. Ensure microphone permissions are granted.
            </Typography>
        </Box>
    )
}

export default SpeechTestPage
