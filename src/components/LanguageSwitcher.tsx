/**
 * 语言切换器组件
 * 用于在导航栏切换中英文
 */

import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { Language as LanguageIcon, Check as CheckIcon } from '@mui/icons-material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const languages = [
    { code: 'zh', name: '简体中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
]

export default function LanguageSwitcher() {
    const { i18n } = useTranslation()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleLanguageChange = (languageCode: string) => {
        i18n.changeLanguage(languageCode)
        handleClose()
    }

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

    return (
        <>
            <IconButton
                onClick={handleClick}
                sx={{
                    color: 'text.primary',
                    borderRadius: 2,
                }}
                aria-label="change language"
            >
                <LanguageIcon />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 180,
                    },
                }}
            >
                {languages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        selected={language.code === currentLanguage.code}
                    >
                        <ListItemIcon sx={{ fontSize: '1.5rem' }}>
                            {language.flag}
                        </ListItemIcon>
                        <ListItemText>{language.name}</ListItemText>
                        {language.code === currentLanguage.code && (
                            <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                        )}
                    </MenuItem>
                ))}
            </Menu>
        </>
    )
}
