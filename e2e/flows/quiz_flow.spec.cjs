const { test, expect } = require('@playwright/test');
const { resetDB, seedArticle } = require('../support/dbHelper.cjs');

test.describe('Quiz Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await resetDB(page);
    });

    test('should allow taking a quiz and viewing results', async ({ page }) => {
        // 1. Seed Article with enough content for quiz generation
        // Note: In E2E, the "Start Quiz" button logic often depends on having enough words or content.
        // For generated source, we might skip generation or mock it.
        // If we want to test "Start Quiz", we assume the "Start Quiz" button is available.
        // In ReadingPage, "Start Quiz" appears if not currently quizzing.

        const article = {
            uuid: 'quiz-article-123',
            title: 'Quiz Test Article',
            content: 'One Two Three Four Five. This is content for quiz.',
            targetWords: ['One', 'Two'],
            difficultyLevel: 'L1',
            createdAt: Date.now(),
            source: 'generated'
        };
        await seedArticle(page, article);

        // 2. Go to Home and click article to ensure correct ID navigation
        await page.goto('/');
        await page.reload(); // Ensure data is loaded

        const card = page.getByText('Quiz Test Article');
        await expect(card).toBeVisible();
        await card.click();

        // 3. Start Quiz
        const startBtn = page.getByText('Start Quiz');
        await expect(startBtn).toBeVisible();

        // NOTE: Clicking "Start Quiz" triggers a real LLM API call which is not mocked yet.
        // For E2E infrastructure phase, we stop here.
        // TODO: Implement page.route() to mock /api/generate or seed a ready-to-take quiz record.

        // await startBtn.click();

        // 4. In Quiz View... (Skipped)

    });
});
