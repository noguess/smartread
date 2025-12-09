import { Word, Setting, WordStudyItem } from './db'
import { GeneratedContent } from './mockLLMService'

const SYSTEM_PROMPT_ARTICLE = `
You are an expert English teacher for middle school students preparing for the Zhongkao (Chinese middle school entrance exam).
Your task is to write a short, engaging story or article that incorporates a specific list of vocabulary words.

IMPORTANT: You MUST return ONLY valid JSON. Do not include any explanatory text before or after the JSON.

The JSON structure must be:
{
  "title": "Title of the article",
  "content": "The article content in Markdown format. **CRITICAL**: You MUST wrap ALL target words in **double asterisks** to bold them (e.g., **ambitious**).",
  "targetWords": ["word1", "word2"]
}
`

const SYSTEM_PROMPT_QUIZ = `
You are an expert English teacher acting as a test generator.
Your task is to generate reading comprehension and vocabulary questions based on a provided article and target words.

IMPORTANT: You MUST return ONLY valid JSON.

The JSON structure must be:
{
  "readingQuestions": [
    {
      "id": "r1",
      "type": "contextual",
      "stem": "Question text?",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct Option",
      "explanation": "Brief explanation of why this answer is correct."
    }
  ],
  "vocabularyQuestions": [
    {
      "id": "v1",
      "type": "definition",
      "stem": "Word definition/context",
      "options": ["word1", "word2", "word3", "word4"],
      "answer": "word1",
      "explanation": "Brief explanation of the word meaning/usage."
    }
  ]
}
`

export interface GeneratedArticleData {
   title: string
   topic?: string
   difficulty_assessed?: string
   content: string
   targetWords: string[]
   word_study?: WordStudyItem[]
}

export const llmService = {

   /**
    * @deprecated This method is kept for backward compatibility. 
    * It internally calls generateArticleOnly and generateQuizForArticle.
    */
   async generateArticle(
      words: Word[],
      settings: Setting,
      onProgress?: (progress: number) => void
   ): Promise<GeneratedContent & { word_study?: WordStudyItem[] }> {
      // Split progress: 50% for article, 50% for quiz
      const handleProgress = (base: number, p: number) => {
         onProgress?.(base + (p * 0.5))
      }

      const articleData = await this.generateArticleOnly(words, settings, (p) => handleProgress(0, p))

      const quizData = await this.generateQuizForArticle(
         articleData.content,
         words,
         settings,
         (p) => handleProgress(50, p)
      )

      return {
         title: articleData.title,
         content: articleData.content,
         readingQuestions: quizData.readingQuestions,
         vocabularyQuestions: quizData.vocabularyQuestions,
         word_study: articleData.word_study
      }
   },


   // ... (inside generateArticleOnly)
   async generateArticleOnly(
      words: Word[],
      settings: Setting,
      onProgress?: (progress: number) => void
   ): Promise<GeneratedArticleData> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'

      if (!apiKey) throw new Error('API Key is missing. Please configure it in Settings.')

      const wordList = words.map((w) => w.spelling).join(', ')
      const lengthPrompt = settings.articleLenPref === 'short' ? '400 words' : settings.articleLenPref === 'long' ? '800 words' : '600 words'
      const difficultyLevel = settings.difficultyLevel || 'L2'
      const cefrLevel = difficultyLevel === 'L1' ? 'A1' : difficultyLevel === 'L2' ? 'A2' : 'B1';

      const difficultyMap = {
         'L1': `Beginner Level (Grade 7 / CEFR A1). 
               - Sentence Structure: Short, simple sentences (Subject + Verb + Object). 
               - Vocabulary: High-frequency basic words only. 
               - Goal: Build confidence for beginners.`,

         'L2': `Standard Zhongkao Level (Grade 8-9 / CEFR A2). 
               - Sentence Structure: Mix of simple and compound sentences. Introduction of basic clauses (time, if-clauses).
               - Vocabulary: Standard Zhongkao core vocabulary.
               - Goal: Match the difficulty of standard reading tasks in the exam.`,

         'L3': `Advanced/Distinction Level (High School Prep / CEFR B1). 
               - Sentence Structure: Complex sentences with embedded clauses (relative clauses, participle phrases). 
               - Vocabulary: Richer vocabulary including abstract concepts.
               - Goal: Challenge the student, aimed at getting full marks in the hardest exam questions.`
      };

      const levelDescription = difficultyMap[difficultyLevel] || difficultyMap['L2'];

      const userPrompt = `
         # Role
         You are an expert English Teacher specializing in **China's Senior High School Entrance Examination (Zhongkao)**.
         You adhere to the **"New Curriculum Standard"** values.

         # Parameters
         - **Target Words**: [${wordList}]
         - **Target Length**: Approx. ${lengthPrompt} words
         - **Difficulty Level**: ${difficultyLevel} (${cefrLevel})

         # Instructions

         1. **Topic Selection**
            - Select a topic aligned with Zhongkao themes (School Life, Personal Growth, Chinese Culture, Science).

         2. **Difficulty & Complexity Control** (CRITICAL)
            - **Constraint**: ${levelDescription}
            - You must STRICTLY adjust your sentence structures and abstraction level according to the description above.
            - Do not make it too hard for ${difficultyLevel} students, and do not make it too childish for ${difficultyLevel} students.

         3. **Vocabulary Control**
            - **Target Words**: Integrate them naturally. Wrap them in **double asterisks**.
            - **Other Words**: Keep strictly within the **${cefrLevel}** vocabulary range.

         4. **Values**
            - Convey positive, educational values suitable for Chinese teenagers.

         5. **Word Study Analysis** (CRITICAL)
            - For the "word_study" array in JSON, you MUST analyze each **Target Word** used in your article.
            - **Meaning in Context**: Provide the specific Chinese meaning *as used in the article*.
            - **Example**: If "light" is used as a verb ("ignite"), the meaning MUST be "点燃" (v.), NOT "光线" (n.).

         # Output Format
         Return valid JSON only:
         {
         "title": "Title",
         "topic": "Theme",
         "difficulty_assessed": "${difficultyLevel}",
         "content": "Article content...",
         "word_study": [ { "word": "target word 1", "part_of_speech": "n./v./adj.", "meaning_in_context": "Brief Chinese meaning fitting this article" } ]
         }
         `;

      const rawData = await this._callDeepSeek(apiKey, baseUrl, SYSTEM_PROMPT_ARTICLE, userPrompt, onProgress)

      // Adaptation layer for new format
      let finalTargetWords: string[] = []

      // Strategy 1: Use 'targetWords' (from old format or if AI is smart enough to include it)
      if (Array.isArray(rawData.targetWords)) {
         finalTargetWords = rawData.targetWords
      }
      // Strategy 2: Extract from 'word_study' if available and valid
      else if (Array.isArray(rawData.word_study)) {
         finalTargetWords = rawData.word_study.map((item: any) => item.word).filter((w: any) => typeof w === 'string')
      }
      // Strategy 3: Fallback to input words (worst case, might not match generated content strictly)
      else {
         console.warn('LLM did not return targetWords or word_study. Falling back to requested words.')
         finalTargetWords = words.map(w => w.spelling)
      }

      return {
         title: rawData.title,
         content: rawData.content,
         targetWords: finalTargetWords,
         topic: rawData.topic,
         difficulty_assessed: rawData.difficulty_assessed,
         word_study: rawData.word_study
      }
   },

   async generateQuizForArticle(
      articleContent: string,
      words: Word[],
      settings: Setting,
      onProgress?: (progress: number) => void
   ): Promise<{ readingQuestions: any[]; vocabularyQuestions: any[] }> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'
      const difficultyLevel = settings.difficultyLevel || 'L2'

      const questionConfig = {
         'L1': { total: 10, description: 'Cloze(3) + Definition(3) + Audio Selection(2) + Matching(1 set of 3 pairs)' },
         'L2': { total: 10, description: 'Contextual(4) + Spelling Input(2) + Cloze(2) + Synonym/Antonym(1) + Audio Dictation(1)' },
         'L3': { total: 12, description: 'Spelling Input(3) + Contextual(3) + Word Form(2) + Audio Dictation(2) + Synonym/Antonym(1) + Matching(1 set of 3 pairs)' }
      }
      // @ts-ignore
      const config = questionConfig[difficultyLevel] || questionConfig['L2']

      const fullSystemPrompt = `${SYSTEM_PROMPT_QUIZ}

VOCABULARY QUESTIONS CONFIGURATION FOR LEVEL ${difficultyLevel}:
${config.description}

REQUIREMENTS:
- Distractors MUST have the same part of speech.
- For cloze questions, sentences MUST be taken directly from the article.
- For contextual questions, sentences MUST be NEW (not from article).
- For audio questions, always include "phonetic" field with IPA notation.
- For matching questions, use "pairs" array.
- For spelling/wordForm questions, do NOT include "options" field.
- Always include "explanation" field.
`

      const userPrompt = `
ARTICLE:
${articleContent}

TARGET WORDS:
${words.map(w => w.spelling).join(', ')}

Generate 4 Reading Comprehension questions and ${config.total} Vocabulary questions.
`
      return this._callDeepSeek(apiKey, baseUrl, fullSystemPrompt, userPrompt, onProgress)
   },

   async getChineseDefinition(
      word: string,
      settings: Setting
   ): Promise<{ definition: string; phonetic: string }> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'

      if (!apiKey) throw new Error('API Key is missing')

      const systemPrompt = `
You are a helpful English-Chinese dictionary assistant.
Return a JSON object with:
{
  "definition": "Concise Chinese definition (max 15 chars)",
  "phonetic": "IPA phonetic symbol"
}
`
      const userPrompt = `Define the word: "${word}"`

      return this._callDeepSeek(apiKey, baseUrl, systemPrompt, userPrompt)
   },

   async analyzeSentence(
      sentence: string,
      settings: Setting
   ): Promise<string> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'

      if (!apiKey) throw new Error('API Key is missing')

      const systemPrompt = `
# Role
你是一位拥有 20 年经验的资深英语语言学家和 ESL 教学专家。你擅长将晦涩难懂的英语长难句拆解得如“手术刀”般精准,并能用通俗易懂的中文讲解语法逻辑。

# CRITICAL RULE (重要指令)
**请务必全程使用中文（简体）进行回答。**
尽管用户发送的是英文句子，但你的任务是为中国学生进行讲解，因此所有的分析、语法解释、结构拆解必须使用中文。

# Goal
当我发送一个英语长难句时，请严格按照以下【5步分析法】进行深度解析，帮助我彻底理解句意和语法结构。
请直接返回 Markdown 格式的内容。

# Workflow
## 1. 🔍 翻译对照
* **直译**：按照英文语序字对字翻译（中文）。
* **意译**：符合中文习惯的流畅翻译（中文）。

## 2. 🦴 核心骨架
* 提取句子的核心成分（Subject + Verb + Object），忽略修饰语。

## 3. 🔪 结构拆解
* 将句子按意群拆分，并用**中文**标注每个部分的作用（如：定语从句修饰xx）。

## 4. 💡 语法痛点
* 用通俗易懂的**中文**解析句中最难的语法点。

## 5. 📖 核心词汇
* 提取 3-5 个关键生词，提供音标、词性、**中文释义**及例句。
`
      const userPrompt = `Analyze this sentence: "${sentence}"`

      return this._callDeepSeek(apiKey, baseUrl, systemPrompt, userPrompt, undefined, false)
   },

   async _callDeepSeek(
      apiKey: string,
      baseUrl: string,
      systemPrompt: string,
      userPrompt: string,
      onProgress?: (p: number) => void,
      expectJson: boolean = true
   ): Promise<any> {
      console.log('Starting LLM generation...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      try {
         const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
               model: 'deepseek-chat',
               messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt },
               ],
               temperature: 0.7,
               response_format: expectJson ? { type: 'json_object' } : undefined,
            }),
            signal: controller.signal
         })

         clearTimeout(timeoutId)

         if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(`API Error: ${response.status} ${err.error?.message || ''}`)
         }

         const reader = response.body?.getReader()
         if (!reader) throw new Error('Response body is not readable')

         const contentLength = Number(response.headers.get('Content-Length')) || 50000
         let receivedLength = 0
         const chunks: Uint8Array[] = []

         while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
            receivedLength += value.length
            const progress = Math.min((receivedLength / contentLength) * 99, 99)
            onProgress?.(progress)
         }

         const chunksAll = new Uint8Array(receivedLength)
         let position = 0
         for (const chunk of chunks) {
            chunksAll.set(chunk, position)
            position += chunk.length
         }

         const responseText = new TextDecoder('utf-8').decode(chunksAll)
         const data = JSON.parse(responseText)
         const contentStr = data.choices[0]?.message?.content

         if (!contentStr) throw new Error('Empty response from API')

         onProgress?.(100)

         if (expectJson) {
            return JSON.parse(contentStr)
         }
         return contentStr

      } catch (error: any) {
         console.error('LLM Service Error:', error)
         if (error.name === 'AbortError') throw new Error('Request timed out')
         throw error
      }
   },
}
