/**
 * V2.0 组件样式覆盖
 * 统一设置圆角、阴影等视觉参数
 */

import { Components, Theme } from '@mui/material/styles'
import { primaryGradient } from './palette'

export const components: Components<Omit<Theme, 'components'>> = {
    // Card 组件
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: 16,  // 从 8px 增加到 16px
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',  // 柔和扩散阴影
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                },
            },
        },
    },

    // Paper 组件
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 16,
            },
            elevation1: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            },
            elevation2: {
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            },
            elevation3: {
                boxShadow: '0 6px 16px rgba(0,0,0,0.07)',
            },
        },
    },

    // Button 组件
    MuiButton: {
        defaultProps: {
            disableElevation: false,
        },
        styleOverrides: {
            root: {
                borderRadius: 12,  // 从 4px 增加到 12px
                padding: '10px 24px',
                fontSize: '0.9375rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'scale(1.02)',
                },
            },
            contained: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                },
            },
            containedPrimary: {
                background: `linear-gradient(135deg, ${primaryGradient.start} 0%, ${primaryGradient.end} 100%)`,
                '&:hover': {
                    background: `linear-gradient(135deg, ${primaryGradient.start} 0%, ${primaryGradient.end} 100%)`,
                    opacity: 0.9,
                },
            },
        },
    },

    // Chip 组件（徽章）
    MuiChip: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                fontWeight: 500,
                fontSize: '0.875rem',
            },
            filled: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            },
        },
    },

    // Dialog 对话框
    MuiDialog: {
        styleOverrides: {
            paper: {
                borderRadius: 20,  // 更大的圆角
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            },
        },
    },

    // TextField 输入框
    MuiTextField: {
        defaultProps: {
            variant: 'outlined',
        },
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: 12,
                    '&:hover fieldset': {
                        borderColor: primaryGradient.start,
                    },
                },
            },
        },
    },

    // LinearProgress 进度条
    MuiLinearProgress: {
        styleOverrides: {
            root: {
                borderRadius: 4,
                height: 6,
                background: 'linear-gradient(90deg, rgba(74,144,226,0.1) 0%, rgba(123,104,238,0.1) 100%)',
            },
            bar: {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${primaryGradient.start} 0%, ${primaryGradient.end} 100%)`,
            },
        },
    },

    // Drawer 抽屉
    MuiDrawer: {
        styleOverrides: {
            paper: {
                borderRadius: '0 20px 20px 0',  // 右侧圆角
            },
        },
    },

    // AppBar
    MuiAppBar: {
        styleOverrides: {
            root: {
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            },
        },
    },

    // Tooltip
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                borderRadius: 8,
                fontSize: '0.875rem',
                padding: '8px 12px',
            },
        },
    },

    // IconButton
    MuiIconButton: {
        styleOverrides: {
            root: {
                borderRadius: 10,
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'scale(1.1)',
                },
            },
        },
    },
}
