const { test, expect } = require('@playwright/test');
const { resetDB, seedArticle } = require('../support/dbHelper.cjs');

test.describe('Reading Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await resetDB(page);
    });

    test('should display seeded article and allow reading', async ({ page }) => {
        // 1. Seed Data
        const article = {
            uuid: 'test-article-123',
            title: 'E2E Test Article',
            content: 'This is a **test** article content for E2E validation.',
            targetWords: ['test'],
            difficultyLevel: 'L1',
            createdAt: Date.now(),
            source: 'generated'
        };
        await seedArticle(page, article);

        // 2. Reload to list articles
        await page.reload();

        // 3. Verify Article Card on Home
        // Use a more specific selector if possible, or wait for text
        const articleTitle = page.getByText('E2E Test Article');
        await expect(articleTitle).toBeVisible();

        // 4. Navigate to Reading Page
        await articleTitle.click();

        // 5. Verify Reading Page content
        await expect(page.getByText('This is a test article')).toBeVisible();
    });
});
