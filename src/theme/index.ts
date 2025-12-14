/**
 * V2.0 主题系统
 * 统一导出主题配置和相关工具
 */

import { createTheme, ThemeOptions } from '@mui/material/styles'
import { lightPalette, eyeCarePalette } from './palette'
import { typography } from './typography'
import { components } from './components'

// 主题类型
export type ThemeMode = 'light' | 'eyeCare'

// 创建浅色模式主题
export const lightTheme = createTheme({
    palette: lightPalette,
    typography,
    components,
    shape: {
        borderRadius: 8,  // 全局默认圆角 (Reduced from 12)
    },
    spacing: 8,  // 默认间距单位
} as ThemeOptions)

// 创建护眼模式主题
export const eyeCareTheme = createTheme({
    palette: eyeCarePalette,
    typography,
    components,
    shape: {
        borderRadius: 8,
    },
    spacing: 8,
} as ThemeOptions)

// 导出所有主题（带类型索引签名）
export const themes: Record<ThemeMode, ReturnType<typeof createTheme>> = {
    light: lightTheme,
    eyeCare: eyeCareTheme,
}

// 导出调色板和其他配置供组件直接使用
export * from './palette'
export * from './typography'
