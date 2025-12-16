import React from 'react'
import {
    Box,
    Paper,
    Typography,
    Stack,
    useTheme,
    alpha
} from '@mui/material'

export interface BaseListCardProps {
    icon: React.ReactNode;
    title: string;
    onTitleClick?: () => void;

    // Slot for the chip/badge next to title
    badge?: React.ReactNode;

    // Custom icon box color overrides
    iconBoxColor?: { bg: string, color: string };

    // Slot for date, tags, duration (Middle Row 1)
    metadata?: React.ReactNode;

    // Slot for scores, counts (Middle Row 2)
    stats?: React.ReactNode;

    // Right side actions
    actions?: React.ReactNode;

    // Optional hover interactions
    onClick?: () => void;
}

const BaseListCard: React.FC<BaseListCardProps> = ({
    icon,
    title,
    onTitleClick,
    badge,
    iconBoxColor,
    metadata,
    stats,
    actions,
    onClick
}) => {
    const theme = useTheme()

    // Default icon box style if not provided
    const boxStyle = iconBoxColor || {
        bg: theme.palette.grey[100],
        color: theme.palette.grey[700]
    }

    // Determine hover styles
    const hoverStyles = {
        boxShadow: theme.shadows[2],
        borderColor: 'primary.100',
    }

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.100',
                transition: 'all 0.3s',
                '&:hover': onClick || onTitleClick ? hoverStyles : undefined,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 3,
                overflow: 'hidden',
                position: 'relative',
                cursor: onClick ? 'pointer' : 'default',
                mb: 2
            }}
        >
            {/* Left: Icon Box */}
            <Box sx={{ flexShrink: 0 }}>
                <Box
                    sx={{
                        width: { xs: 56, sm: 64 },
                        height: { xs: 56, sm: 64 },
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: iconBoxColor ? alpha(iconBoxColor.bg, 0.5) : boxStyle.bg,
                        color: boxStyle.color,
                    }}
                >
                    {/* Clone icon to enforce size or just wrap? Wrapping is safer. */}
                    {/* Assuming icon is an SvgIcon element, we can clone it to change fontSize, 
                       but it's better if the caller passes it with correct size or we wrap it in a styled Box that controls svg size.
                       MUI icons inherit font size. */}
                    <Box sx={{
                        display: 'flex',
                        fontSize: { xs: 28, sm: 32 },
                        '& > svg': { fontSize: 'inherit' }
                    }}>
                        {icon}
                    </Box>
                </Box>
            </Box>

            {/* Middle: Content */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                {/* Header: Title + Badge */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                                fontWeight: 700,
                                color: 'text.primary',
                                lineHeight: 1.2,
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                '&:hover': onTitleClick ? { color: 'primary.main', cursor: 'pointer' } : undefined
                            }}
                            onClick={(e) => {
                                if (onTitleClick) {
                                    e.stopPropagation()
                                    onTitleClick()
                                }
                            }}
                        >
                            {title}
                        </Typography>
                        {badge}
                    </Box>
                </Box>

                {/* Metadata Row */}
                {metadata && (
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                        {metadata}
                    </Stack>
                )}

                {/* Stats Row */}
                {stats && (
                    <Stack direction="row" spacing={2} alignItems="center">
                        {stats}
                    </Stack>
                )}

            </Box>

            {/* Right: Actions */}
            {actions && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'row', sm: 'column' },
                        alignItems: { xs: 'center', sm: 'flex-end' },
                        justifyContent: { xs: 'space-between', sm: 'center' },
                        gap: 1.5,
                        borderTop: { xs: '1px solid', sm: 'none' },
                        borderColor: 'grey.100',
                        pt: { xs: 2, sm: 0 },
                        // Prevent click on actions from triggering card click if needed?
                        // Usually buttons stopPropagation themselves if they have onClick.
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {actions}
                </Box>
            )}
        </Paper>
    )
}

export default BaseListCard
