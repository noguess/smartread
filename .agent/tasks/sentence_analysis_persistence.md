# Task List: Sentence Analysis Persistence

## 1. Database Upgrade
- [ ] Modified `src/services/db.ts`
    - Defined interface `SentenceAnalysis`
        - `id?: number`
        - `articleId: string` (uuid of article, optional if we handle external text, but for ReadingPage it's important)
        - `originalSentence: string`
        - `analysisResult: string` (markdown)
        - `createdAt: number`
    - Bumped DB version to 5.
    - Added `sentenceAnalysis: '++id, articleId'` to stores.

## 2. Service Implementation
- [ ] Created `src/services/analysisStorageService.ts`
    - `saveAnalysis(articleId, sentence, result)`
    - `findAnalysis(articleId, sentence)`
        - Logic: Filter by `articleId`.
        - Iterating over all records for that article (usually small < 50).
        - "50% overlap rule":
            - Normalize both strings (lowercase, punctuation removed).
            - Check if `stored.includes(target)` or `target.includes(stored)` (simple containment).
            - OR check overlap similarity.
            - *Plan Refinement*: User asked for "50% content overlap".
            - Implementation: Tokenize both to Sets of words. Calculate Intersection Size / Target Set Size. If > 0.5, return it.

## 3. Testing (TDD)
- [ ] Created `src/services/analysisStorageService.test.ts`
    - Test `saveAnalysis` persistence.
    - Test `findAnalysis` with exact match.
    - Test `findAnalysis` with >50% overlap.
    - Test `findAnalysis` with <50% overlap (should return null).

## 4. UI Integration
- [ ] Modified `src/components/reading/SentenceAnalysisPopover.tsx`
    - Accept `articleId` as prop.
    - In `handleAnalyze`:
        - First call `analysisStorageService.findAnalysis`.
        - If found, set result directly (and maybe show "From Cache" indicator?)
        - If not, call `llmService`.
        - On success, call `analysisStorageService.saveAnalysis`.
- [ ] Modified `src/pages/ReadingPage.tsx`
    - Pass `currentArticle.uuid` to `SentenceAnalysisPopover`.

## 5. Documentation
- [ ] Update `ARCHITECTURE.md` with new Schema.
