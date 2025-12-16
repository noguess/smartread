export const LevelColors: Record<string, { bg: string, text: string, color: 'success' | 'info' | 'error' | 'warning' }> = {
    'L1': { bg: '#ECFDF5', text: '#047857', color: 'success' }, // Emerald-100 / Emerald-700
    'L2': { bg: '#EFF6FF', text: '#1D4ED8', color: 'info' },    // Blue-100 / Blue-700
    'L3': { bg: '#FFF1F2', text: '#BE123C', color: 'error' },    // Rose-100 / Rose-700
}

export const getLevelStyle = (level: string, defaultTheme: any) => {
    return LevelColors[level] || {
        bg: defaultTheme.palette.grey[100],
        text: defaultTheme.palette.grey[700],
        color: 'default'
    }
}
