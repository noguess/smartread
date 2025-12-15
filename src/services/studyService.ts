import { quizRecordService } from './quizRecordService'
import { wordService } from './wordService'
import { settingsService } from './settingsService'
import { SRSAlgorithm } from '../utils/SRSAlgorithm'
import { Word } from './db'
import { calculateNewDifficulty, DifficultyLevel } from '../utils/difficultyLogic'

export interface QuizSubmissionResult {
    recordId: number
    score: number
    newDifficulty: string | null
    wordResults: Record<string, boolean>
}

export const studyService = {
    async submitQuizSession(
        recordId: number,
        answers: { reading: Record<string, string>; vocabulary: Record<string, string | string[]> },
        targetWords: Word[],
        quizTimeSpent: number
    ): Promise<QuizSubmissionResult> {
        const targetRecord = await quizRecordService.getQuizRecordById(recordId)
        if (!targetRecord || !targetRecord.id) {
            throw new Error(`Quiz record not found for id: ${recordId}`)
        }

        // 1. Calculate Score
        const readingQs = targetRecord.questions.reading || []
        const vocabQs = targetRecord.questions.vocabulary || []

        let readingCorrect = 0
        readingQs.forEach(q => {
            if (answers.reading[q.id] === q.answer) readingCorrect++
        })

        let vocabCorrect = 0
        const wordResults: Record<string, boolean> = {}

        // Async SRS updates
        for (const q of vocabQs) {
            const userAns = answers.vocabulary[q.id]
            const correctAns = q.answer

            // Flexible matching logic
            let isCorrect = false
            if (Array.isArray(correctAns) && Array.isArray(userAns)) {
                isCorrect = JSON.stringify(correctAns) === JSON.stringify(userAns)
            } else {
                isCorrect = String(userAns).toLowerCase() === String(correctAns).toLowerCase()
            }

            if (isCorrect) vocabCorrect++

            // Update SRS
            // Using targetWord to find Word object
            const targetWord = 'targetWord' in q ? (q as any).targetWord : undefined
            const word = targetWords.find(w => w.spelling === targetWord)
                || targetWords.find(w => q.stem.includes(w.spelling)) // Fallback

            if (word) {
                wordResults[word.spelling] = isCorrect
                const updates = SRSAlgorithm.calculateNextReview(word, isCorrect)

                // Update Word in DB
                // Note: In a real app we might batch these, but here we do 1-by-1 as per original Logic
                if (word.id) {
                    await wordService.updateWord(word.id, updates)
                }
            }
        }

        const totalQ = readingQs.length + vocabQs.length
        const totalCorrect = readingCorrect + vocabCorrect
        const score = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0

        // 2. Adjust Difficulty
        const readingAccuracy = readingQs.length > 0 ? readingCorrect / readingQs.length : 0
        const totalAccuracy = totalQ > 0 ? totalCorrect / totalQ : 0

        let newDifficulty: string | null = null
        const settings = await settingsService.getSettings()

        if (settings) {
            const calculatedLevel = calculateNewDifficulty(settings.difficultyLevel as DifficultyLevel, { readingAccuracy, totalAccuracy })
            if (calculatedLevel !== settings.difficultyLevel) {
                await settingsService.saveSettings({ difficultyLevel: calculatedLevel })
                newDifficulty = calculatedLevel
            }
        }

        // 3. Update Record in DB (mark as complete)
        const savedReadingTime = targetRecord.readingDuration || 0
        const totalTime = savedReadingTime + quizTimeSpent

        await quizRecordService.updateQuizRecord(targetRecord.id, {
            userAnswers: answers,
            score: score,
            timeSpent: totalTime,
            quizDuration: quizTimeSpent,
            wordResults: wordResults,
            difficultyFeedback: 3 // Default
        })

        return {
            recordId: targetRecord.id,
            score,
            newDifficulty,
            wordResults
        }
    }
}
