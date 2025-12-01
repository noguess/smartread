/**
 * V2.0 渐变按钮组件
 * 带有渐变背景和微动效的主要操作按钮
 */

import { Button, ButtonProps } from '@mui/material'
import { styled } from '@mui/material/styles'

interface GradientButtonProps extends ButtonProps {
    gradientType?: 'primary' | 'success' | 'warning'
}

const gradients = {
    primary: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
}

const StyledButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'gradientType',
})<GradientButtonProps>(({ theme, gradientType = 'primary' }) => ({
    background: gradients[gradientType],
    color: '#fff',
    borderRadius: 12,
    padding: '10px 28px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all 0.2s ease',
    textTransform: 'none',
    position: 'relative',
    overflow: 'hidden',

    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
        opacity: 0,
        transition: 'opacity 0.2s ease',
    },

    '&:hover': {
        transform: 'translateY(-2px) scale(1.02)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        '&::before': {
            opacity: 1,
        },
    },

    '&:active': {
        transform: 'translateY(0) scale(0.98)',
    },

    '&:disabled': {
        background: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
        boxShadow: 'none',
    },
}))

export default function GradientButton({ children, gradientType = 'primary', ...props }: GradientButtonProps) {
    return (
        <StyledButton gradientType={gradientType} {...props}>
            {children}
        </StyledButton>
    )
}
