import { Word } from './db'

export interface Question {
    id: string
    // 支持8种题型
    type: 'cloze' | 'definition' | 'spelling' | 'contextual' | 'audio' | 'wordForm' | 'synonym' | 'matching'
    targetWord?: string // 关联的核心单词 (词汇题必须有)
    stem: string // 题干
    options?: string[] // 选择题型有options，输入题型无options
    answer: string | string[] // 单个答案或多个答案（matching题型）
    // 音频题型专用字段
    audioUrl?: string // 音频文件URL或用于TTS的音标
    phonetic?: string // 音标，用于TTS生成
    // 匹配题型专用字段
    pairs?: { word: string; definition: string }[] // 单词-释义配对
}

export interface GeneratedContent {
    title: string
    content: string
    readingQuestions: Question[] // 4道阅读理解题
    vocabularyQuestions: Question[] // 词汇专项题 (L1/L2: 10题, L3: 12题)
}

export const mockLLMService = {
    async generateArticle(words: Word[], settings?: { difficultyLevel?: 'L1' | 'L2' | 'L3' }): Promise<GeneratedContent> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const wordList = words.map((w) => w.spelling).join(', ')
        const difficultyLevel = settings?.difficultyLevel || 'L2'

        // 根据难度等级准备不同的词汇题配置
        const vocabularyQuestions: Question[] = []

        if (difficultyLevel === 'L1') {
            // L1: 10题 - 完形填空(3) + 词义辨析(3) + 音频跟读选择(2) + 英英释义匹配(1组3对)

            // 完形填空 x3
            for (let i = 0; i < Math.min(3, words.length); i++) {
                const word = words[i]
                vocabularyQuestions.push({
                    id: `v${i}_cloze`,
                    type: 'cloze',
                    targetWord: word.spelling,
                    stem: `The student is very _______ and works hard every day.`,
                    options: [word.spelling, 'lazy', 'sleepy', 'hungry'],
                    answer: word.spelling
                })
            }

            // 词义辨析 x3 (中英双语)
            for (let i = 3; i < Math.min(6, words.length); i++) {
                const word = words[i] || words[0]
                vocabularyQuestions.push({
                    id: `v${i}_def`,
                    type: 'definition',
                    targetWord: word.spelling,
                    stem: `Select the correct meaning of "${word.spelling}"`,
                    options: [
                        `${word.meaning} (${word.spelling})`,
                        '懒惰的 (lazy)',
                        '快乐的 (happy)',
                        '困难的 (difficult)'
                    ],
                    answer: `${word.meaning} (${word.spelling})`
                })
            }

            // 音频跟读选择 x2
            for (let i = 0; i < Math.min(2, words.length); i++) {
                const word = words[i]
                vocabularyQuestions.push({
                    id: `v${i}_audio`,
                    type: 'audio',
                    targetWord: word.spelling,
                    stem: `Listen and choose the correct spelling:`,
                    phonetic: word.phonetic || '/test/',
                    options: [word.spelling, word.spelling + 'e', word.spelling.slice(0, -1), word.spelling + 'd'],
                    answer: word.spelling
                })
            }

            // 英英释义匹配 x1组(3对)
            const matchWords = words.slice(0, 3)
            vocabularyQuestions.push({
                id: 'v_matching',
                type: 'matching',
                stem: 'Match the words with their English definitions:',
                pairs: matchWords.map(w => ({
                    word: w.spelling,
                    definition: `The meaning of ${w.spelling}`
                })),
                answer: matchWords.map((w, idx) => `${w.spelling}-def${idx}`)
            })

        } else if (difficultyLevel === 'L2') {
            // L2: 10题 - 情境应用(4) + 拼写输入(2) + 完形填空(2) + 同义/反义词(1) + 音频听写选择(1)

            // 情境应用 x4
            for (let i = 0; i < Math.min(4, words.length); i++) {
                const word = words[i]
                vocabularyQuestions.push({
                    id: `v${i}_ctx`,
                    type: 'contextual',
                    targetWord: word.spelling,
                    stem: `My brother is very _______ about his future and works hard to achieve his goals.`,
                    options: [word.spelling, 'worried', 'confused', 'relaxed'],
                    answer: word.spelling
                })
            }

            // 拼写输入 x2
            for (let i = 4; i < Math.min(6, words.length); i++) {
                const word = words[i] || words[0]
                vocabularyQuestions.push({
                    id: `v${i}_spell`,
                    type: 'spelling',
                    targetWord: word.spelling,
                    stem: `Spell the word that means: ${word.meaning}`,
                    phonetic: word.phonetic || '/test/',
                    answer: word.spelling
                })
            }

            // 完形填空 x2
            for (let i = 0; i < Math.min(2, words.length); i++) {
                const word = words[i]
                vocabularyQuestions.push({
                    id: `v${i}_cloze2`,
                    type: 'cloze',
                    targetWord: word.spelling,
                    stem: `She has a very _______ personality.`,
                    options: [word.spelling, 'bad', 'old', 'new'],
                    answer: word.spelling
                })
            }

            // 同义/反义词 x1
            const synWord = words[0]
            vocabularyQuestions.push({
                id: 'v_syn',
                type: 'synonym',
                targetWord: synWord.spelling,
                stem: `Select the synonym of "${synWord.spelling}"`,
                options: ['similar word', 'opposite word', 'wrong word', 'random word'],
                answer: 'similar word'
            })

            // 音频听写选择 x1
            const audioWord = words[1] || words[0]
            vocabularyQuestions.push({
                id: 'v_audio2',
                type: 'audio',
                targetWord: audioWord.spelling,
                stem: `Listen and choose the correct word:`,
                phonetic: audioWord.phonetic || '/test/',
                options: [audioWord.spelling, audioWord.spelling + 'ly', audioWord.spelling + 'ed', audioWord.spelling + 'ing'],
                answer: audioWord.spelling
            })

        } else {
            // L3: 12题 - 拼写输入(3) + 情境应用(3) + 词形变换(2) + 音频完整听写(2) + 同义/反义词(1) + 英英释义匹配(1组3对)

            // 拼写输入 x3
            for (let i = 0; i < Math.min(3, words.length); i++) {
                const word = words[i]
                vocabularyQuestions.push({
                    id: `v${i}_spell3`,
                    type: 'spelling',
                    targetWord: word.spelling,
                    stem: `Write the correct word based on the definition: ${word.meaning}`,
                    phonetic: word.phonetic || '/test/',
                    answer: word.spelling
                })
            }

            // 情境应用 x3
            for (let i = 0; i < Math.min(3, words.length); i++) {
                const word = words[i]
                vocabularyQuestions.push({
                    id: `v${i}_ctx3`,
                    type: 'contextual',
                    targetWord: word.spelling,
                    stem: `Despite facing numerous challenges in his career, Jack remained incredibly _______ and never gave up.`,
                    options: [word.spelling, 'disappointed', 'exhausted', 'uncertain'],
                    answer: word.spelling
                })
            }

            // 词形变换 x2
            for (let i = 0; i < Math.min(2, words.length); i++) {
                const word = words[i]
                vocabularyQuestions.push({
                    id: `v${i}_form`,
                    type: 'wordForm',
                    targetWord: word.spelling,
                    stem: `Fill in the blank with the correct form: She is known for her _______ (${word.spelling}).`,
                    answer: word.spelling + 'ness' // Mock变形
                })
            }

            // 音频完整听写 x2
            for (let i = 0; i < Math.min(2, words.length); i++) {
                const word = words[i]
                vocabularyQuestions.push({
                    id: `v${i}_audio3`,
                    type: 'audio',
                    targetWord: word.spelling,
                    stem: `Listen and spell the word you hear:`,
                    phonetic: word.phonetic || '/test/',
                    answer: word.spelling
                })
            }

            // 同义/反义词 x1
            const synWord3 = words[0]
            vocabularyQuestions.push({
                id: 'v_syn3',
                type: 'synonym',
                targetWord: synWord3.spelling,
                stem: `Select the antonym of "${synWord3.spelling}"`,
                options: ['opposite word', 'same word', 'wrong word', 'random word'],
                answer: 'opposite word'
            })

            // 英英释义匹配 x1组(3对)
            const matchWords3 = words.slice(0, 3)
            vocabularyQuestions.push({
                id: 'v_matching3',
                type: 'matching',
                stem: 'Match the words with their complex English definitions:',
                pairs: matchWords3.map(w => ({
                    word: w.spelling,
                    definition: `Advanced definition of ${w.spelling}`
                })),
                answer: matchWords3.map((w, idx) => `${w.spelling}-def${idx}`)
            })
        }

        return {
            title: `Mock Article - ${difficultyLevel} Level`,
            content: `
This is a **mock** article generated for testing purposes at ${difficultyLevel} difficulty level.
It is designed to help you learn the following words: **${wordList}**.

The content would vary based on the difficulty level. 
For ${difficultyLevel}, the article would be ${difficultyLevel === 'L1' ? 'simple and clear' : difficultyLevel === 'L2' ? 'moderately challenging' : 'complex with advanced vocabulary'}.

The end.
      `.trim(),
            readingQuestions: [
                {
                    id: 'q1',
                    type: 'contextual',
                    stem: `What is the main topic of this article?`,
                    options: ['Learning words', 'Space travel', 'Cooking', 'History'],
                    answer: 'Learning words',
                },
                {
                    id: 'q2',
                    type: 'contextual',
                    stem: `What difficulty level is this article?`,
                    options: [difficultyLevel, 'Unknown', 'Mixed', 'Variable'],
                    answer: difficultyLevel,
                },
                {
                    id: 'q3',
                    type: 'contextual',
                    stem: `How many target words are included?`,
                    options: [words.length.toString(), '0', '100', '500'],
                    answer: words.length.toString(),
                },
                {
                    id: 'q4',
                    type: 'contextual',
                    stem: `What kind of article is this?`,
                    options: ['Mock Test', 'News', 'Fiction', 'Biography'],
                    answer: 'Mock Test',
                },
            ],
            vocabularyQuestions,
        }
    },
}
