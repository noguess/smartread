
/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { QuizRecord } from './db'

describe('SmartReaderDB Schema', () => {
    it('QuizRecord type allows optional score', () => {
        // This test purely verifies that TypeScript allows creating an object
        // with the shape of 'Draft Quiz' (no score/answers) and assigning it to QuizRecord type.
        // If the schema was wrong (required fields), this file wouldn't compile.

        const draftRecord: QuizRecord = {
            id: 123,
            articleId: 'draft-test-uuid',
            date: Date.now(),
            questions: { reading: [], vocabulary: [] }
            // score, userAnswers undefined
        }

        expect(draftRecord.score).toBeUndefined()
        expect(draftRecord.articleId).toBe('draft-test-uuid')
    })
})
