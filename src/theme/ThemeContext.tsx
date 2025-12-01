/**
 * 主题模式 Context
 * 提供全局主题切换功能
 */

import { createContext, useContext, useState, ReactNode } from 'react'

type ThemeMode = 'light' | 'eyeCare'

interface ThemeContextType {
    themeMode: ThemeMode
    setThemeMode: (mode: ThemeMode) => void
    toggleThemeMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'smart-reader-theme-mode'

export function ThemeProvider({ children }: { children: ReactNode }) {
    // 从 localStorage 读取保存的主题，默认为 light
    const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY)
        return (saved === 'eyeCare' ? 'eyeCare' : 'light') as ThemeMode
    })

    // 主题变更时保存到 localStorage
    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode)
        localStorage.setItem(THEME_STORAGE_KEY, mode)
    }

    // 切换主题（在浅色和护眼模式间切换）
    const toggleThemeMode = () => {
        setThemeMode(themeMode === 'light' ? 'eyeCare' : 'light')
    }

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, toggleThemeMode }}>
            {children}
        </ThemeContext.Provider>
    )
}

// 自定义 Hook
export function useThemeMode() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useThemeMode must be used within a ThemeProvider')
    }
    return context
}
