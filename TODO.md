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
