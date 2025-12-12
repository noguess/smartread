## [Feature] iPad Portrait UI (DashboardVertical)
- [x] Task 1 (Component): Create `DashboardVerticalLayout.tsx`.
    -   Implement the "Vertical Dashboard" design from `hero.html` using MUI components.
    -   Use `t()` for i18n key reuse.
    -   Map `lucide-react` icons to `@mui/icons-material`.
- [x] Task 2 (Page): Update `HomePage.tsx`.
    -   Integrate `DashboardVerticalLayout`.
    -   Use `useMediaQuery` to switch between `Desktop Layout` (existing) and `Vertical Layout` (new) based on breakpoint (`down('lg')`).

## [Feature] Deep Learning Link
- [x] Task 1: Replace "View Examples" with "Deep Learning" link in Dashboard components (Hero/Vertical) and connect to global search.


## [Feature] History UI Refresh
- [x] Task 1 (Component): Create `HistoryListCard.tsx` adapting `ArticleListCard` style for Quiz Records.
    - [x] Props: `EnhancedQuizRecord`
    - [x] Layout: Same as Article Card (Icon Left, Info Middle, Action Right).
    - [x] Stats: Show Score (emphasized) and Duration/Date.
- [x] Task 2 (Page): Update `QuizHistoryPage` to use `HistoryListCard`.
    - [x] Remove old `List/ListItem` layout.
    - [x] Pass `onReview` handler.
- [x] Task 3 (Polish): Verify responsive layout and interactions.

## [Feature] Refine Article List UI
- [x] Task 1 (Component): Create `ArticleListCard.tsx` implementing the new Card UI (replacing `reader.html` styles with MUI).
- [x] Task 2 (Page): Update `LibraryPage.tsx` to include Tabs (All/Progress/Finished) and Filter Layout.
- [x] Task 3 (Integration): Integrate `ArticleListCard` into `LibraryPage` and map `ArticleWithStats` data correctly.
- [x] Task 4 (Polish): adjust responsive layout and verify interaction (Read/Delete).

## [Feature] Video Pinning
- [x] Task 1 (DB): Update `Word` schema to support `pinnedVideo`.
- [x] Task 2 (UI): Add Pin/Unpin button and logic to `WordDetailModal`.
- [x] Task 3 (Logic): Implement default selection and sorting of pinned videos.


## [Feature] Video Source Isolation
- [x] Task 1 (DB & Settings): Add `videoSource` setting to DB and create settings UI toggle.
- [x] Task 2 (Service): Refactor `videoIndexService` to support strictly isolated search based on `platform`.
- [x] Task 3 (UI): Update `WordDetailModal` to conditional render Bilibili/YouTube players based on setting.
- [x] Task 4 (Backend): Create `youtube_indexer.py` for isolated YouTube data generation.
- [x] Task 5 (Backend): Update `bilibili_indexer.py` to output isolated filenames.
- [x] Task 6 (Verification): Verify toggle switches data source and player correctly.


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

## [Feature] Library List Optimization
- [x] Task 1 (UI): Remove Tabs and Filter section (Revert relevant code).
- [x] Task 2 (Logic): Implement Pagination logic.
    - Support client-side slicing (e.g., 10 items per page).
    - Or update `articleService` to support `limit/offset`.
- [x] Task 3 (UI): Implement "Load More" button.
    - [x] Show only if `hasMore` is true.
    - [x] Appends data to list.
