import { db, SentenceAnalysis } from './db'

export const analysisStorageService = {
    /**
     * Save a new analysis result to local database
     */
    async saveAnalysis(articleId: string, originalSentence: string, analysisResult: string): Promise<number> {
        return await db.sentenceAnalysis.add({
            articleId,
            originalSentence,
            analysisResult,
            createdAt: Date.now()
        })
    },

    /**
     * Find a matching analysis record using fuzzy logic (>50% content overlap)
     */
    async findMatchingAnalysis(articleId: string, selectionText: string): Promise<SentenceAnalysis | null> {
        // 1. Get all records for this article
        // Note: We use 'all' because fuzzy matching needs JS logic.
        // Assuming number of analyzed sentences per article is small (<100).
        const candidates = await db.sentenceAnalysis.where('articleId').equals(articleId).toArray()

        if (!candidates || candidates.length === 0) return null

        const selectionTokens = this._tokenize(selectionText)
        if (selectionTokens.size === 0) return null

        let bestMatch: SentenceAnalysis | null = null
        let maxScore = -1

        for (const candidate of candidates) {
            const score = this._calculateOverlap(selectionTokens, candidate.originalSentence)

            // Criteria: Coverage >= 50%
            if (score >= 0.5) {
                // If we have multiple matches, prefer the one with higher score
                // If scores are equal, maybe prefer the one with closer length? 
                // For now, simple logic is fine.
                if (score > maxScore) {
                    maxScore = score
                    bestMatch = candidate
                }
            }
        }

        return bestMatch
    },

    // Internal helpers exposed for testing if needed (but private convention)
    _tokenize(text: string): Set<string> {
        return new Set(
            text.toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "") // Remove punctuation
                .split(/\s+/)
                .filter(w => w.length > 0)
        )
    },

    _calculateOverlap(selectionTokens: Set<string>, candidateText: string): number {
        const candidateTokens = this._tokenize(candidateText)
        let matchCount = 0

        // Count how many tokens from selection are present in candidate
        selectionTokens.forEach(token => {
            if (candidateTokens.has(token)) {
                matchCount++
            }
        })

        return matchCount / selectionTokens.size
    }
}
