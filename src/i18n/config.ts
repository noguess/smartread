/**
 * i18n 国际化配置
 * 支持中文和英文切换
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入翻译文件
import zhCommon from '../locales/zh/common.json'
import zhHome from '../locales/zh/home.json'
import zhVocabulary from '../locales/zh/vocabulary.json'
import zhHistory from '../locales/zh/history.json'
import zhSettings from '../locales/zh/settings.json'
import zhStatistics from '../locales/zh/statistics.json'
import zhReading from '../locales/zh/reading.json'
import zhLibrary from '../locales/zh/library.json'

import enCommon from '../locales/en/common.json'
import enHome from '../locales/en/home.json'
import enVocabulary from '../locales/en/vocabulary.json'
import enHistory from '../locales/en/history.json'
import enSettings from '../locales/en/settings.json'
import enStatistics from '../locales/en/statistics.json'
import enReading from '../locales/en/reading.json'
import enLibrary from '../locales/en/library.json'

// 配置资源
const resources = {
    zh: {
        common: zhCommon,
        home: zhHome,
        vocabulary: zhVocabulary,
        history: zhHistory,
        settings: zhSettings,
        statistics: zhStatistics,
        reading: zhReading,
        library: zhLibrary,
    },
    en: {
        common: enCommon,
        home: enHome,
        vocabulary: enVocabulary,
        history: enHistory,
        settings: enSettings,
        statistics: enStatistics,
        reading: enReading,
        library: enLibrary,
    },
}

i18n
    .use(LanguageDetector) // 检测用户语言
    .use(initReactI18next) // 传递 i18n 实例给 react-i18next
    .init({
        resources,
        fallbackLng: 'zh', // 默认语言
        defaultNS: 'common', // 默认命名空间
        ns: ['common', 'home', 'vocabulary', 'history', 'settings', 'statistics', 'reading', 'library'], // 所有命名空间

        detection: {
            // 语言检测顺序
            order: ['localStorage', 'navigator'],
            // localStorage key
            lookupLocalStorage: 'i18nextLng',
            // 缓存用户语言
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false, // React 已经防止 XSS
        },

        react: {
            useSuspense: false, // 不使用 Suspense（避免闪烁）
        },
    })

export default i18n
