
import { describe, it, expect } from 'vitest'
import { isMultipleChoice, isCloze, isMatching, isGeneric } from './questionInfo'
import { Question } from './db'

describe('Question Type Guards', () => {
    it('isMultipleChoice identifies correct types', () => {
        expect(isMultipleChoice({ type: 'multiple_choice' } as Question)).toBe(true)
        expect(isMultipleChoice({ type: 'audioSelection' } as Question)).toBe(true)
        expect(isMultipleChoice({ type: 'synonym' } as Question)).toBe(true)
        expect(isMultipleChoice({ type: 'contextual' } as Question)).toBe(true)

        expect(isMultipleChoice({ type: 'cloze' } as Question)).toBe(false)
    })

    it('isCloze identifies correct types', () => {
        expect(isCloze({ type: 'cloze' } as Question)).toBe(true)
        expect(isCloze({ type: 'spelling' } as Question)).toBe(true)
        expect(isCloze({ type: 'wordForm' } as Question)).toBe(true)
    })

    it('isMatching identifies correct types', () => {
        expect(isMatching({ type: 'matching' } as Question)).toBe(true)
        expect(isMatching({ type: 'synonymAntonym' } as Question)).toBe(true)
    })

    it('isGeneric identifies fallback types', () => {
        expect(isGeneric({ type: 'definition' } as Question)).toBe(true)
        expect(isGeneric({ type: 'audio' } as Question)).toBe(true)

        expect(isGeneric({ type: 'multiple_choice' } as Question)).toBe(false)
    })
})
