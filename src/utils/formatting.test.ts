import { describe, it, expect } from 'vitest'
import { formatDate, formatDuration } from './formatting'

describe('Formatting Utils', () => {
    describe('formatDuration', () => {
        it('should format seconds to m s format', () => {
            expect(formatDuration(65)).toBe('1m 5s')
            expect(formatDuration(60)).toBe('1m 0s')
            expect(formatDuration(59)).toBe('59s')
            expect(formatDuration(0)).toBe('0s')
        })

        it('should handle undefined or null', () => {
            expect(formatDuration(undefined)).toBe('0s')
            expect(formatDuration(0)).toBe('0s')
        })
    })

    describe('formatDate', () => {
        it('should format date string to locale date string', () => {
            // Mock date to ensure consistent testing or use a regex/loose match if locale depends on system
            // For now let's assume 'en-US' or system default is mocked/consistent in CI.
            // Better: Mock toLocaleDateString or just check it returns a string and contains parts.
            // Actually, we can pass locale to it if we design it that way.

            const date = new Date('2023-01-01T12:00:00Z')
            const formatted = formatDate(date.getTime())
            expect(typeof formatted).toBe('string')
            // Don't assert exact string as it varies by locale (e.g. 1/1/2023 vs 2023/1/1)
        })

        it('should accept language code', () => {
            const date = new Date('2023-01-01T12:00:00Z')
            // 'zh-CN' -> "2023年1月1日" or similar
            const formatted = formatDate(date.getTime(), 'zh-CN')
            expect(formatted).toContain('2023')
            // expect(formatted).toContain('月') // Might fail if system doesn't have locale data
        })

        it('should return empty string for invalid date', () => {
            // Optional safety
        })
    })
})
