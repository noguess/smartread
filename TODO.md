
## [Feature] iPad Interaction Optimization (Selection & Menu)
- [x] Task 1 (Event): Prevent System Context Menu & Enable Touch.
    - **Problem**: Screenshot shows system vertical context menu (right-click/long-press behavior) blocking app interaction. Touch selection doesn't trigger app popover.
    - **Fix**: In `ArticleContent.tsx`, add `onContextMenu={e => e.preventDefault()}` to block system menu. Add `onTouchEnd={handleSelection}` to support touch selection.
- [x] Task 2 (UI): Mobile Bottom Sheet Strategy.
    - **Problem**: System horizontal selection menu (Copy/Paste) often conflicts with floating popovers on mobile.
    - **Fix**: Update `ReadingPage.tsx` popover logic. On mobile/tablet (`theme.breakpoints.down('md')`), force `DefinitionPopover` and `SentenceAnalysisPopover` to be fixed at the *bottom* of the screen (Bottom Sheet style) instead of floating near text. Use `useMediaQuery` to switch modes.
## [Feature] iPad & Tablet Adaptation
- [x] Task 1 (Layout): Implement Responsive Navigation (Drawer).
    - **Problem**: Permanent sidebar (240px) squeezes content on iPad.
    - **Fix**: Use `useMediaQuery` (theme.breakpoints.down('lg')) to switch Sidebar to `temporary` variant. Add Hamburger menu to AppBar.
- [x] Task 2 (Home): Force Vertical Stacking on Tablet.
    - **Problem**: 2-column layout (Hero + Stats) causes extreme squeezing on iPad.
    - **Fix**: Update `HomePage.tsx` Grid to use `xs={12} lg={8}` for Hero / `xs={12} lg={4}` for Stats (Stack content on `md` screens).
- [x] Task 3 (Hero): Fix Internal Layout Compression.
    - **Problem**: Screenshot shows "Streak/Time" text forced into vertical layout due to lack of width. Blue Word Card squeezes main actions.
    - **Fix**: Refactor `DashboardHero` to stack internal elements on smaller screens (Text/Stats top, Word Card bottom, or full-width rows). Fix flex/grid constraints on stats circles.
- [x] Task 4 (Reading): Verify Reading View.
    - **Action**: Check `ReadingPage` container widths and ensure text readable after Layout fix. (Verified: `maxWidth: 860px` applied via `ArticleContent`, Sidebar hides on `<lg` to allow full width reading).

## [Feature] Error Handling & Feedback
- [x] Task 1 (Reading): Improve "Quiz Generation Failed" UX. Use `Snackbar` instead of blocking `error` state, ensuring user stays on 'reading' view with a visible alert.
- [x] Task 2 (History): Add feedback when loading a review fails. Pass explanation via `navigate` state or use a global notification context.
- [x] Task 3 (WordDetail): Handle definition fetch failures in `WordDetailModal` with a graceful "Definition not found" or "Network error" UI state.
- [x] Task 4 (UI): Polish the blocking "Generation Failed" screen in `ReadingPage` to use the new `EmptyState` component styling for consistency.
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
