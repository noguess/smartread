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
            }
            const id = await db.settings.add(defaultSettings)
            return { ...defaultSettings, id }
        }
        return settings[0]
    },

    async saveSettings(changes: Partial<Setting>) {
        const current = await this.getSettings()
        if (current && current.id) {
            return await db.settings.update(current.id, changes)
        }
    },
}
