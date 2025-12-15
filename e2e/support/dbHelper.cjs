async function resetDB(page) {
    await page.evaluate(async () => {
        if (window.resetAppDB) {
            await window.resetAppDB();
        }
    });
}

async function seedArticle(page, article) {
    await page.evaluate(async (data) => {
        if (window.db) {
            await window.db.articles.add(data);
        }
    }, article);
}

async function seedWords(page, words) {
    await page.evaluate(async (data) => {
        if (window.db) {
            await window.db.words.bulkAdd(data);
        }
    }, words);
}

module.exports = {
    resetDB,
    seedArticle,
    seedWords
};
