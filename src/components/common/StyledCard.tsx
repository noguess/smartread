/**
 * V2.0 样式化卡片组件
 * 统一的卡片样式，应用新设计系统
 */

import { Card, CardProps } from '@mui/material'
import { styled } from '@mui/material/styles'

interface StyledCardProps extends CardProps {
    hoverable?: boolean  // 是否启用 hover 效果
    gradient?: boolean   // 是否使用渐变背景
}

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'hoverable' && prop !== 'gradient',
})<StyledCardProps>(({ theme, hoverable, gradient }) => ({
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
    background: gradient
        ? 'linear-gradient(135deg, rgba(74,144,226,0.05) 0%, rgba(123,104,238,0.05) 100%)'
        : theme.palette.background.paper,

    ...(hoverable && {
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        },
        '&:active': {
            transform: 'translateY(-2px)',
        },
    }),
}))

export default StyledCard
