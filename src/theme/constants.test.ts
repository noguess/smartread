import { describe, it, expect } from 'vitest'
import { LevelColors, getLevelStyle } from './constants'

describe('Theme Constants', () => {
    it('should have correct LevelColors', () => {
        expect(LevelColors['L1']).toBeDefined()
        expect(LevelColors['L1'].color).toBe('success')
        expect(LevelColors['L2'].color).toBe('info')
    })

    it('should return default style for unknown level', () => {
        const mockTheme = {
            palette: {
                grey: {
                    100: '#f5f5f5',
                    700: '#616161'
                }
            }
        }
        const style = getLevelStyle('Unknown', mockTheme)
        expect(style.bg).toBe('#f5f5f5')
        expect(style.color).toBe('default')
    })
})
