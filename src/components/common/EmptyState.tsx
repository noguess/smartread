/**
 * V2.0 空状态组件
 * 用于展示友好的空状态提示
 */

import { Box, Typography, Paper } from '@mui/material'
import { ReactNode } from 'react'

interface EmptyStateProps {
    icon?: string | ReactNode  // Emoji 或自定义图标
    title: string
    description?: string
    action?: ReactNode  // 可选的操作按钮
    minHeight?: number
}

export default function EmptyState({
    icon = '📭',
    title,
    description,
    action,
    minHeight = 300,
}: EmptyStateProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight,
                p: 4,
                bgcolor: 'transparent',
                textAlign: 'center',
            }}
        >
            {/* Icon/Emoji */}
            <Box
                sx={{
                    fontSize: '4rem',
                    mb: 2,
                    opacity: 0.8,
                    animation: 'float 3s ease-in-out infinite',
                    '@keyframes float': {
                        '0%, 100%': { transform: 'translateY(0)' },
                        '50%': { transform: 'translateY(-10px)' },
                    },
                }}
            >
                {icon}
            </Box>

            {/* Title */}
            <Typography
                variant="h6"
                fontWeight="600"
                color="text.primary"
                gutterBottom
            >
                {title}
            </Typography>

            {/* Description */}
            {description && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 400, mb: 3 }}
                >
                    {description}
                </Typography>
            )}

            {/* Action Button */}
            {action && <Box sx={{ mt: 2 }}>{action}</Box>}
        </Paper>
    )
}
