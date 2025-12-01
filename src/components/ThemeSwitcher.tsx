/**
 * 主题切换组件
 * 用于在设置页面切换浅色/护眼模式
 */

import { Box, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Paper, Typography } from '@mui/material'
import { Brightness7, RemoveRedEye } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useThemeMode } from '../theme/ThemeContext'

export default function ThemeSwitcher() {
    const { t } = useTranslation(['settings'])
    const { themeMode, setThemeMode } = useThemeMode()

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <FormControl component="fieldset">
                <FormLabel component="legend">
                    <Typography variant="h6" gutterBottom>
                        {t('settings:theme.title')}
                    </Typography>
                </FormLabel>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('settings:theme.description')}
                </Typography>
                <RadioGroup
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value as 'light' | 'eyeCare')}
                >
                    <FormControlLabel
                        value="light"
                        control={<Radio />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Brightness7 fontSize="small" />
                                <Box>
                                    <Typography variant="body1">{t('settings:theme.light')}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('settings:theme.lightDesc')}
                                    </Typography>
                                </Box>
                            </Box>
                        }
                    />
                    <FormControlLabel
                        value="eyeCare"
                        control={<Radio />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RemoveRedEye fontSize="small" />
                                <Box>
                                    <Typography variant="body1">{t('settings:theme.eyeCare')}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('settings:theme.eyeCareDesc')}
                                    </Typography>
                                </Box>
                            </Box>
                        }
                    />
                </RadioGroup>
            </FormControl>
        </Paper>
    )
}
