
export type DifficultyLevel = 'L1' | 'L2' | 'L3';

export const calculateNewDifficulty = (
    currentLevel: DifficultyLevel,
    readingCorrectCount: number,
    feedbackDifficulty: number
): DifficultyLevel => {
    let newLevel = currentLevel;

    // Upgrade Condition: Reading 4/4 correct AND Feedback <= 2 (Easy)
    if (readingCorrectCount === 4 && feedbackDifficulty <= 2) {
        if (currentLevel === 'L1') newLevel = 'L2';
        else if (currentLevel === 'L2') newLevel = 'L3';
    }
    // Downgrade Condition: Reading < 2 correct AND Feedback >= 4 (Hard or Too Hard)
    // Relaxed from strictly 5 to 4 based on user feedback
    else if (readingCorrectCount < 2 && feedbackDifficulty >= 4) {
        if (currentLevel === 'L3') newLevel = 'L2';
        else if (currentLevel === 'L2') newLevel = 'L1';
    }

    return newLevel;
};
