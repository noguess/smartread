
import { db } from './db'
import { settingsService } from './settingsService'

describe('SettingsService', () => {
    beforeEach(async () => {
        if (db.isOpen()) {
            await db.settings.clear()
        }
    })

    it('should initialize with default videoSource as bilibili', async () => {
        const settings = await settingsService.getSettings()
        expect(settings.videoSource).toBe('bilibili')
    })

    it('should update videoSource setting', async () => {
        await settingsService.saveSettings({ videoSource: 'youtube', apiKey: 'test' })
        const settings = await settingsService.getSettings()
        expect(settings.videoSource).toBe('youtube')
    })
})
