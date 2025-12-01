import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import App from './App.tsx'
import './i18n/config' // 初始化 i18n

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <CssBaseline />
            <App />
        </BrowserRouter>
    </StrictMode>,
)
