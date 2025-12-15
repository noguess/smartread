---
description: Run automated E2E tests for the Smart Reader application
---

# 🕵️‍♀️ Automated E2E Testing

This workflow runs the Playwright end-to-end testing suite to verify critical business flows (Reading, Quizzes, etc.) in a real browser environment.

## Steps

1.  **Determine Test Scope**
    Analyze the user's request and recently modified files to decide the test scope:
    - **Full Regression**: Run all tests. (Default if not specified)
    - **Related Only**: Run only the E2E specs relevant to the changed files.

2.  **Execute Tests**
    - **Option A: Full Suite**
      ```bash
      npm run test:e2e
      ```
    - **Option B: Specific Specs**
      Identify the relevant `.spec.cjs` files (e.g., if `QuizView.tsx` changed, run `quiz_flow.spec.cjs`).
      ```bash
      npx playwright test e2e/flows/<specific_test>.spec.cjs
      ```

3.  **Report**
    Check the terminal output. If tests fail, suggest opening the report:
    ```bash
    npx playwright show-report
    ```
