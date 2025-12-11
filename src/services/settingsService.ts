import { db, Setting } from './db'

export const settingsService = {
    async getSettings() {
        const settings = await db.settings.toArray()
        if (settings.length === 0) {
            // Should be seeded, but just in case
            const defaultSettings: Setting = {
                apiKey: '',
                articleLenPref: 'medium',
                dailyNewLimit: 10,
                difficultyLevel: 'L2', // Initialize default difficultyLevel
                videoSource: 'bilibili', // Default to Bilibili
            }
            const id = await db.settings.add(defaultSettings)
            return { ...defaultSettings, id }
        }

        const currentSettings = settings[0]
        if (!currentSettings.difficultyLevel) {
            currentSettings.difficultyLevel = 'L2'
            await db.settings.update(currentSettings.id!, { difficultyLevel: 'L2' })
        }
        if (!currentSettings.videoSource) {
            currentSettings.videoSource = 'bilibili'
            await db.settings.update(currentSettings.id!, { videoSource: 'bilibili' })
        }
        return currentSettings
    },

    async saveSettings(changes: Partial<Setting>) {
        const current = await this.getSettings()
        if (current && current.id) {
            return await db.settings.update(current.id, changes)
        }
    },
}
