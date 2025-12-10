
export type DifficultyLevel = 'L1' | 'L2' | 'L3';

export interface AccuracyStats {
    readingAccuracy: number; // 0.0 - 1.0
    totalAccuracy: number;   // 0.0 - 1.0
}

export const calculateNewDifficulty = (
    currentLevel: DifficultyLevel,
    stats: AccuracyStats
): DifficultyLevel => {
    let newLevel = currentLevel;
    const { readingAccuracy, totalAccuracy } = stats;

    // Upgrade Logic: Both must be high
    // Reading >= 80% AND Total >= 85%
    if (readingAccuracy >= 0.8 && totalAccuracy >= 0.85) {
        if (currentLevel === 'L1') newLevel = 'L2';
        else if (currentLevel === 'L2') newLevel = 'L3';
    }
    // Downgrade Logic: Either is too low
    // Reading < 50% OR Total < 60%
    else if (readingAccuracy < 0.5 || totalAccuracy < 0.6) {
        if (currentLevel === 'L3') newLevel = 'L2';
        else if (currentLevel === 'L2') newLevel = 'L1';
    }

    return newLevel;
};
