import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import App from './App.tsx'
import './i18n/config' // 初始化 i18n

import { db } from './services/db'

// E2E Test Helper: Expose DB reset
if (import.meta.env.DEV) {
    (window as any).db = db;
    (window as any).resetAppDB = async () => {
        await db.delete()
        await db.open()
        console.log('🔥 DB Reset Complete')
    }
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CssBaseline />
            <App />
        </BrowserRouter>
    </StrictMode>,
)
