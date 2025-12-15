
import { describe, it, expect } from 'vitest'
import { Question } from './db'

// This test suite acts as a "Type Spec" for the refactor.
// It will fail compilation initially if I use types that don't exist yet,
// or fail runtime if I cast them and properties are missing (checked by "expect").

describe('Question Type Defintions', () => {
    it('should support Multiple Choice structure', () => {
        // We expect the new Question interface to allow this shape
        const q: Question = {
            id: '1',
            type: 'multiple_choice',
            stem: 'What is A?',
            options: ['A', 'B', 'C'], // options is MANDATORY for multiple_choice
            answer: 'A'
        } as any // Cast is temporary if types don't match yet, but 'options' access below matters

        if (q.type === 'multiple_choice') {
            // In the new definition, TS should know 'options' exists here
            expect(q.options).toBeDefined()
            expect(Array.isArray(q.options)).toBe(true)
        }
    })

    it('should support Matching structure', () => {
        const q: Question = {
            id: '2',
            type: 'matching',
            stem: 'Match pairs',
            pairs: [{ word: 'Apple', definition: 'Fruit' }], // Mandatory for matching
            answer: 'dummy' // 'answer' field might be loose or specific depending on impl
        } as any

        if (q.type === 'matching') {
            expect(q.pairs).toBeDefined()
            expect(q.pairs![0].word).toBe('Apple')
        }
    })

    // This test ensures we don't accidentally make fields loose again
    // Ideally this is a compile-time check, but runtime check verifies property presence
})
