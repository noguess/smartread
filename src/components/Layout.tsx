import { ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    InputAdornment,
    IconButton,
} from '@mui/material'
import {
    Home as HomeIcon,
    History as HistoryIcon,
    Book as VocabularyIcon,
    Settings as SettingsIcon,
    Search as SearchIcon,
    BarChart as BarChartIcon,
    AutoStories as LibraryIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

import WordDetailModal from './WordDetailModal'
import LanguageSwitcher from './LanguageSwitcher'

const drawerWidth = 240

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useTranslation(['common'])
    const [searchQuery, setSearchQuery] = useState('')
    const [wordModalOpen, setWordModalOpen] = useState(false)
    const [selectedWord, setSelectedWord] = useState('')

    const menuItems = [
        { text: t('common:nav.home'), icon: <HomeIcon />, path: '/' },
        { text: t('common:nav.library'), icon: <LibraryIcon />, path: '/library' },
        { text: t('common:nav.history'), icon: <HistoryIcon />, path: '/history' },
        { text: t('common:nav.vocabulary'), icon: <VocabularyIcon />, path: '/vocabulary' },
        { text: t('common:nav.statistics'), icon: <BarChartIcon />, path: '/statistics' },
        { text: t('common:nav.settings'), icon: <SettingsIcon />, path: '/settings' },
    ]

    const handleSearch = () => {
        if (searchQuery.trim()) {
            setSelectedWord(searchQuery.trim())
            setWordModalOpen(true)
            setSearchQuery('') // Clear search after opening modal
        }
    }

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* Left Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: 'linear-gradient(180deg, #4A90E2 0%, #7B68EE 100%)',
                        color: 'white',
                    },
                }}
            >
                <Box sx={{ p: 2, textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    📚 {t('common:appName')}
                </Box>
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                selected={location.pathname === item.path}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    '&.Mui-selected': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                    color: 'white',
                                }}
                            >
                                <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            {/* Main Content Area */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Top App Bar with Search */}
                <AppBar
                    position="static"
                    color="default"
                    elevation={1}
                    sx={{ backgroundColor: 'background.paper' }}
                >
                    <Toolbar>
                        <TextField
                            placeholder={t('common:button.search') + '...'}
                            variant="outlined"
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch()
                                }
                            }}
                            sx={{ flexGrow: 1, maxWidth: 600 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={handleSearch}>
                                            <SearchIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* Language Switcher */}
                        <Box sx={{ ml: 2 }}>
                            <LanguageSwitcher />
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* Content Area */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        overflow: 'auto',
                        backgroundColor: 'background.default',
                    }}
                >
                    {children}
                </Box>
            </Box>

            {/* Global Word Detail Modal */}
            <WordDetailModal
                word={selectedWord}
                open={wordModalOpen}
                onClose={() => setWordModalOpen(false)}
            />
        </Box>
    )
}
