
## [Feature] Auto Difficulty Adjustment & Result Hub
- [x] Task 1 (Logic): Update `calculateNewDifficulty` to use score/accuracy instead of subjective feedback.
- [x] Task 2 (UI): Modify `QuizView` to support a "Result Banner" (score + feedback msg) in `readOnly` mode.
- [x] Task 3 (Flow): Refactor `ReadingPage` submission logic
   - Remove `ScoreFeedback` step.
   - Calculate new difficulty immediately upon submit.
   - Switch directly to `review` mode (with score banner injected).
- [x] Task 4 (Cleanup): Remove `ScoreFeedback.tsx` and updated routes/imports.

## [Feature] Rich Quiz Result Dashboard
- [x] Task 1 (Logic): Update `ReadingPage` to calculate and pass detailed stats (Reading/Vocab breakdown) to `QuizView`.
- [x] Task 2 (UI): Refactor `QuizView` result banner into a full "Result Dashboard" (Score, Feedback, Detailed Stats).
- [x] Task 3 (Interaction): Implement auto-scroll to top and submit button loading state.

## [Feature] UI & Interaction Refinement (Loading & Navigation)
- [x] Task 1 (UI): Refactor `GenerationLoading` component to support 'quiz' mode and simplified terminal UI.
- [x] Task 2 (Logic): Implement `loadQuizReview` to support viewing past quiz results in read-only mode.
- [x] Task 3 (Navigation): Update `RecentActivityList` and `HomePage` to support smart navigation (Article -> Read, Quiz -> Review).
