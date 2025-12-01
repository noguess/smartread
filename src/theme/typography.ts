/**
 * V2.0 字体系统
 * 优化可读性和视觉舒适度
 */

import { TypographyOptions } from '@mui/material/styles/createTypography'

export const typography: TypographyOptions = {
    // 字体栈
    fontFamily: [
        // 英文字体
        'Inter',
        'Poppins',
        // 中文字体
        'Noto Sans SC',
        // 系统默认
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        // Emoji
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
    ].join(','),

    // 标题字体（更有设计感）
    h1: {
        fontFamily: 'Poppins, "Noto Sans SC", sans-serif',
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
        letterSpacing: '-0.01562em',
    },
    h2: {
        fontFamily: 'Poppins, "Noto Sans SC", sans-serif',
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3,
        letterSpacing: '-0.00833em',
    },
    h3: {
        fontFamily: 'Poppins, "Noto Sans SC", sans-serif',
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.4,
    },
    h4: {
        fontFamily: 'Poppins, "Noto Sans SC", sans-serif',
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
    },
    h5: {
        fontFamily: '"Noto Sans SC", sans-serif',
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.5,
    },
    h6: {
        fontFamily: '"Noto Sans SC", sans-serif',
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.5,
    },

    // 正文 - V2.0 升级：17px, 行高 1.7
    body1: {
        fontFamily: 'Inter, "Noto Sans SC", sans-serif',
        fontSize: '1.0625rem', // 17px
        lineHeight: 1.7,
        letterSpacing: '0.5px', // 中英文混排优化
    },
    body2: {
        fontFamily: 'Inter, "Noto Sans SC", sans-serif',
        fontSize: '0.875rem',  // 14px
        lineHeight: 1.6,
        letterSpacing: '0.3px',
    },

    // 按钮
    button: {
        fontFamily: '"Noto Sans SC", sans-serif',
        fontWeight: 500,
        fontSize: '0.9375rem', // 15px
        letterSpacing: '0.46px',
        textTransform: 'none', // 不全部大写
    },

    // 说明文字
    caption: {
        fontFamily: 'Inter, "Noto Sans SC", sans-serif',
        fontSize: '0.75rem',   // 12px
        lineHeight: 1.5,
        letterSpacing: '0.4px',
    },

    // 数字/统计
    overline: {
        fontFamily: 'Inter, DIN Alternate, sans-serif',
        fontSize: '0.75rem',
        lineHeight: 2.5,
        letterSpacing: '1px',
        textTransform: 'uppercase',
    },
}

// 字号调节选项（用于阅读页）
export const fontSizeOptions = {
    small: {
        fontSize: '0.9375rem', // 15px
        lineHeight: 1.7,
    },
    medium: {
        fontSize: '1.0625rem', // 17px (默认)
        lineHeight: 1.8,
    },
    large: {
        fontSize: '1.1875rem', // 19px
        lineHeight: 1.8,
    },
}
