/**
 * V2.0 色彩系统
 * 面向初中生群体的青少年友好配色方案
 */

// 主色调 - 渐变蓝紫色系
export const primaryGradient = {
    start: '#4A90E2', // 活力蓝
    end: '#7B68EE',   // 渐变紫
}

// 辅助色 - 强调色
export const accentColors = {
    mintGreen: '#00D9A5',  // 薄荷绿
    sunYellow: '#FFD93D',   // 阳光黄
}

// 状态色系统
export const statusColors = {
    // 成功/掌握 - 翠绿渐变
    success: {
        main: '#10B981',
        light: '#34D399',
        gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    },
    // 学习中 - 橙色渐变
    learning: {
        main: '#F59E0B',
        light: '#FBBF24',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    },
    // 需复习 - 柔和红色
    review: {
        main: '#EF4444',
        light: '#F87171',
        gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
    },
    // 新词 - 蓝色
    new: {
        main: '#3B82F6',
        light: '#60A5FA',
    },
}

// 浅色模式配色
export const lightPalette = {
    mode: 'light' as const,
    primary: {
        main: primaryGradient.start,
        light: '#6BA8E8',
        dark: '#3B7AC2',
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: accentColors.mintGreen,
        light: '#33E3B5',
        dark: '#00B88A',
        contrastText: '#FFFFFF',
    },
    background: {
        default: '#F8F9FA',     // 米白/浅灰
        paper: '#FFFFFF',        // 纯白
    },
    text: {
        primary: '#1F2937',      // 深灰
        secondary: '#6B7280',    // 中灰
    },
    success: statusColors.success,
    warning: statusColors.learning,
    error: statusColors.review,
    info: statusColors.new,
}

// 护眼模式配色（暖色调）
export const eyeCarePalette = {
    mode: 'light' as const,
    primary: {
        main: '#E89C4A',        // 暖橙色
        light: '#EDB570',
        dark: '#C57E3A',
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#9CB38C',        // 暖绿色
        light: '#B5C7A7',
        dark: '#7F9970',
        contrastText: '#FFFFFF',
    },
    background: {
        default: '#FFF8E7',      // 暖色调米黄
        paper: '#FFFBF0',        // 浅米黄
    },
    text: {
        primary: '#3E3020',      // 暖深棕
        secondary: '#6B5D44',    // 暖中棕
    },
    success: {
        main: '#8FAF6F',
        light: '#A9C489',
    },
    warning: {
        main: '#E0A253',
        light: '#E8B673',
    },
    error: {
        main: '#D97962',
        light: '#E29582',
    },
    info: {
        main: '#7A9EC1',
        light: '#96B3D1',
    },
}

// 阅读高亮色系
export const highlightColors = {
    targetWord: {
        color: '#1976d2',
        background: 'linear-gradient(180deg, transparent 60%, #E3F2FD 60%)',
        hover: 'linear-gradient(180deg, transparent 55%, #BBDEFB 55%)',
    },
    marker: '#FF6B6B',  // 单词标记小圆点
}
