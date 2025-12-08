
import { describe, it, expect } from 'vitest'
import { getLemma } from './textUtils'

describe('textUtils', () => {
    describe('getLemma', () => {
        it('returns infinitive for verbs', () => {
            expect(getLemma('decided')).toBe('decide')
            expect(getLemma('plays')).toBe('play')
            expect(getLemma('running')).toBe('run')
            expect(getLemma('went')).toBe('go')
        })

        it('returns singular for nouns', () => {
            expect(getLemma('books')).toBe('book')
            expect(getLemma('cities')).toBe('city')
        })

        it('returns original if already base or unknown', () => {
            expect(getLemma('decide')).toBe('decide')
            expect(getLemma('book')).toBe('book')
            expect(getLemma('the')).toBe('the')
        })

        it('handles case sensitivity', () => {
            expect(getLemma('Decided')).toBe('decide')
        })
    })
})
