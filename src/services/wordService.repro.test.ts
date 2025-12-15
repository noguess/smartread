import { describe, it, expect, beforeEach } from 'vitest'
import { wordService } from './wordService'
import { db } from './db'

describe('Word Import Reproduction', () => {
    beforeEach(async () => {
        await db.words.clear()
    })

    it('should correctly import words and return added count', async () => {
        const mockWords: any[] = [
            { spelling: 'apple', meaning: '苹果', status: 'New' },
            { spelling: 'banana', meaning: '香蕉', status: 'New' }
        ]

        const result = await wordService.importWords(mockWords)

        expect(result.added).toBe(2)
        expect(result.skipped).toBe(0)

        const allWords = await db.words.toArray()
        expect(allWords.length).toBe(2)
    })

    it('should parse and import actual CSV content correctly', async () => {
        const csvContent = `序号,单词,音标,词性及释义
1,ability,[ə'bɪləti],n. 能力；才能
2,able,['eɪbl],adj. 能够的；有能力的；能干的`

        const lines = csvContent.split('\n').filter(line => line.trim() !== '')
        const words: any[] = []

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            const parts = line.split(',')
            if (parts.length >= 4) {
                const spelling = parts[1].trim()
                const phonetic = parts[2].trim()
                const meaning = parts.slice(3).join(',').trim()
                if (spelling) {
                    words.push({
                        spelling,
                        phonetic,
                        meaning,
                        status: 'New'
                    })
                }
            }
        }

        expect(words.length).toBe(2)
        expect(words[0].spelling).toBe('ability')

        const result = await wordService.importWords(words)
        expect(result.added).toBe(2)
    })
})
