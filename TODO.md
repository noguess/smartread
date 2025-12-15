## [Feature] Quiz Navigation & Header Fixes
- [x] Task 1: 改造 `ReadingLayout.tsx`，解耦 Header 显示逻辑（新增 `headerVisible` prop，默认 true），使其不再受 `sidebarVisible` 限制。
- [x] Task 2: 更新 `ReadingPage.tsx`，在渲染 `ReadingLayout` 时显式传递 `headerVisible={true}`，确保考试页显示顶部计时器栏。
- [x] Task 3: 修改 `QuizView.tsx`，在第一部分（Step 0）隐藏底部左侧“返回”按钮。
- [x] Task 4: 修改 `QuizView.tsx`，在第二部分（Step 1）将底部左侧按钮文案改为“返回上一部分”，并确保点击后回到第一部分。
- [x] Task 5: 修改 `ReadingPage.tsx`，在传递给 `ReadingLayout` 时，根据是否为考试模式（`!sidebarVisible`）控制 `showFontControls` 属性，确保考试页隐藏字体调整模块。

## [Feature] Better Article Generation Error Handling
- [x] Task 1 (State & Logic): Add `error` state to `ReadingPage`. Update `useEffect` to block auto-generation if error exists. Update `handleGenerateArticle` to set error instead of navigating.
- [x] Task 2 (UI Integration): Render `EmptyState` with Retry/Back buttons when error occurs.
- [x] Task 3 (Testing): Update tests to verify Error UI appears and Retry works.

## [Feature] Nested Routes Refactor
- [x] Task 1 (Router): Define ID-based Routes in App.tsx.
    -   Add `/read/:articleId/quiz/:recordId` -> `QuizRouteWrapper`.
    -   Add `/read/:articleId/result/:recordId` -> `ResultRouteWrapper`.
    -   Preserve legacy routes with redirection logic.
- [x] Task 2 (Wrappers): Create Logic Wrappers in ReadingPage.
    -   Implement `QuizRouteWrapper`: Fetch `recordId` from URL -> load data -> render `QuizPage`.
    -   Implement `ResultRouteWrapper`: Fetch `recordId` from URL -> load data -> render `ResultPage`.
    -   Remove reliance on `viewingQuizId` state.
- [x] Task 3 (Navigation): Update Workflow Transitions.
    -   `handleStartQuiz`: Create Draft -> `navigate(.../quiz/:newId)`.
    -   `handleQuizSubmit`: Submit -> `navigate(.../result/:id)`.
    -   `ReadingSidebar`: Clicking history item -> `navigate(.../result/:id)`.
- [x] Task 4 (Cleanup): Remove ambiguous `/result` routes and legacy state code.

## [Feature] Statistics Refactor (Completed)
- [x] Create `StatsService` for centralized data aggregation
- [x] Refactor `StatisticsPage` UI (Tabs: Overview & Trends)
- [x] Implement Score Distribution & Efficiency Metrics
- [x] Implement Trend Charts (Activity, Score, Study Time)
- [x] Internationalization Support

## [Enhancement] Immersive Reading Experience
- [x] UI Polish: Enhance typography, spacing, and maximize content area.
- [x] Interactive: Implement "Click-to-Scroll" and "Breath Highlight" for key words.
- [x] Deep Dive: Fix "Deep Dive" modal trigger and interaction with scroll.
- [x] Performance: Stabilize highlight animation during re-renders (useMemo/useCallback).
