
import { db } from './db'
import { settingsService } from './settingsService'

vi.mock('./db', () => {
    let store: any[] = []
    return {
        db: {
            isOpen: vi.fn(() => true),
            settings: {
                toArray: vi.fn().mockImplementation(() => Promise.resolve([...store])),
                add: vi.fn().mockImplementation((item) => {
                    const id = store.length + 1
                    store.push({ ...item, id })
                    return Promise.resolve(id)
                }),
                update: vi.fn().mockImplementation((id, changes) => {
                    const index = store.findIndex(s => s.id === id)
                    if (index !== -1) {
                        store[index] = { ...store[index], ...changes }
                    }
                    return Promise.resolve(1)
                }),
                clear: vi.fn().mockImplementation(() => {
                    store = []
                    return Promise.resolve()
                })
            }
        }
    }
})

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
