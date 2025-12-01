import { Box, IconButton, Tooltip, Paper } from '@mui/material'
import {
    TextIncrease as TextIncreaseIcon,
    TextDecrease as TextDecreaseIcon,
    TextFields as TextFieldsIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

interface ReadingToolbarProps {
    onFontSizeChange: (size: 'small' | 'medium' | 'large') => void
    currentFontSize: 'small' | 'medium' | 'large'
}

export default function ReadingToolbar({ onFontSizeChange, currentFontSize }: ReadingToolbarProps) {
    const { t } = useTranslation(['reading'])

    const fontSizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large']
    const currentIndex = fontSizes.indexOf(currentFontSize)

    const handleIncrease = () => {
        if (currentIndex < fontSizes.length - 1) {
            onFontSizeChange(fontSizes[currentIndex + 1])
        }
    }

    const handleDecrease = () => {
        if (currentIndex > 0) {
            onFontSizeChange(fontSizes[currentIndex - 1])
        }
    }

    const handleReset = () => {
        onFontSizeChange('medium')
    }

    return (
        <Paper
            elevation={2}
            sx={{
                position: 'sticky',
                top: 80,
                p: 2,
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                width: '100%'
            }}
        >
            <Tooltip title={t('reading:toolbar.fontSizeLabel')} placement="left">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={handleIncrease}
                        disabled={currentIndex === fontSizes.length - 1}
                        sx={{
                            fontSize: '1.3rem',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'scale(1.1)' }
                        }}
                    >
                        <TextIncreaseIcon fontSize="inherit" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={handleReset}
                        sx={{
                            fontSize: '1.1rem',
                            color: currentFontSize === 'medium' ? 'primary.main' : 'text.secondary',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'scale(1.1)' }
                        }}
                    >
                        <TextFieldsIcon fontSize="inherit" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={handleDecrease}
                        disabled={currentIndex === 0}
                        sx={{
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'scale(1.1)' }
                        }}
                    >
                        <TextDecreaseIcon fontSize="inherit" />
                    </IconButton>
                </Box>
            </Tooltip>
        </Paper>
    )
}
