
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { studyService } from './studyService'
import { quizRecordService } from './quizRecordService'
import { wordService } from './wordService'
import { settingsService } from './settingsService'
import { SRSAlgorithm } from '../utils/SRSAlgorithm'

// Mock dependencies
vi.mock('./quizRecordService')
vi.mock('./wordService')
vi.mock('./settingsService')
vi.mock('../utils/SRSAlgorithm')

describe('studyService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('submitQuizSession', () => {
        const mockRecordId = 123
        const mockAnswers = {
            reading: { 'r1': 'A' },
            vocabulary: { 'v1': 'B' }
        }
        const mockTargetWords = [
            { id: 1, spelling: 'apple', status: 'Learning', interval: 0, repetitionCount: 0, addedAt: 0 }
        ] as any[]

        const mockQuizRecord = {
            id: mockRecordId,
            questions: {
                reading: [{ id: 'r1', answer: 'A' }],
                vocabulary: [{ id: 'v1', targetWord: 'apple', answer: 'B', stem: 'Eat an apple' }]
            },
            readingDuration: 100
        } as any

        it('should calculate score, update SRS, adjust difficulty, and save record', async () => {
            // Setup Mocks
            vi.mocked(quizRecordService.getQuizRecordById).mockResolvedValue(mockQuizRecord)
            vi.mocked(SRSAlgorithm.calculateNextReview).mockReturnValue({
                status: 'Review',
                nextReviewAt: 1000,
                interval: 1,
                repetitionCount: 1,
                easinessFactor: 2.5
            })
            vi.mocked(settingsService.getSettings).mockResolvedValue({ difficultyLevel: 'L2' } as any)
            vi.mocked(settingsService.saveSettings).mockResolvedValue(1)
            vi.mocked(quizRecordService.updateQuizRecord).mockResolvedValue(1)

            // Execute
            const result = await studyService.submitQuizSession(
                mockRecordId,
                mockAnswers,
                mockTargetWords,
                50 // quizTimeSpent
            )

            // Total 2 qs: Reading Correct (A==A), Vocab Correct (B==B) -> 100%
            expect(result.score).toBe(100)

            // Verify SRS Update
            expect(SRSAlgorithm.calculateNextReview).toHaveBeenCalledWith(
                expect.objectContaining({ spelling: 'apple' }),
                true // isCorrect
            )
            expect(wordService.updateWord).toHaveBeenCalled()

            // Verify Record Update
            expect(quizRecordService.updateQuizRecord).toHaveBeenCalledWith(
                mockRecordId,
                expect.objectContaining({
                    score: 100,
                    timeSpent: 150, // 100 (reading) + 50 (quiz)
                    quizDuration: 50,
                    wordResults: { 'apple': true }
                })
            )

            // Verify Return
            expect(result.recordId).toBe(mockRecordId)
        })

        it('should handle incorrect answers', async () => {
            const incorrectAnswers = {
                reading: { 'r1': 'B' }, // Wrong
                vocabulary: { 'v1': 'C' } // Wrong
            }

            vi.mocked(quizRecordService.getQuizRecordById).mockResolvedValue(mockQuizRecord)

            const result = await studyService.submitQuizSession(
                mockRecordId,
                incorrectAnswers,
                mockTargetWords,
                50
            )

            expect(result.score).toBe(0)
            expect(SRSAlgorithm.calculateNextReview).toHaveBeenCalledWith(
                expect.any(Object),
                false // isIncorrect
            )
        })
    })


})
