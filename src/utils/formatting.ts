/**
 * Format duration in seconds to "Xm Ys" or "Ys" format.
 * @param seconds Number of seconds
 */
export const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0s'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
}

/**
 * Format timestamp or Date object to locale date string.
 * @param date Date object, timestamp number, or date string
 * @param locale Optional locale (default: undefined, uses system default)
 * @param options Optional Intl.DateTimeFormatOptions
 */
export const formatDate = (
    date: Date | number | string,
    locale?: string,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
): string => {
    try {
        const d = new Date(date)
        // Check for invalid date
        if (isNaN(d.getTime())) return ''
        return d.toLocaleDateString(locale, options)
    } catch {
        return ''
    }
}
