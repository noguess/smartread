import { Word, Setting } from './db'
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

export const llmService = {
   /**
    * @deprecated This method is kept for backward compatibility. 
    * It internally calls generateArticleOnly and generateQuizForArticle.
    */
   async generateArticle(
      words: Word[],
      settings: Setting,
      onProgress?: (progress: number) => void
   ): Promise<GeneratedContent> {
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
         vocabularyQuestions: quizData.vocabularyQuestions
      }
   },

   async generateArticleOnly(
      words: Word[],
      settings: Setting,
      onProgress?: (progress: number) => void
   ): Promise<{ title: string; content: string; targetWords: string[] }> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'

      if (!apiKey) throw new Error('API Key is missing. Please configure it in Settings.')

      const wordList = words.map((w) => w.spelling).join(', ')
      const lengthPrompt = settings.articleLenPref === 'short' ? '400 words' : settings.articleLenPref === 'long' ? '800 words' : '600 words'
      const difficultyLevel = settings.difficultyLevel || 'L2'
      const cefrLevel = difficultyLevel === 'L1' ? 'A1' : difficultyLevel === 'L2' ? 'A2' : 'B1'

      const userPrompt = `
Please write an article using the following target words: ${wordList}.
Difficulty Level: ${difficultyLevel} (CEFR ${cefrLevel})
Target length: approximately ${lengthPrompt}.

IMPORTANT requirements:
1. Ensure all target words are wrapped in **double asterisks** like **word**
2. Return ONLY valid JSON with title, content, and targetWords.
`
      return this._callDeepSeek(apiKey, baseUrl, SYSTEM_PROMPT_ARTICLE, userPrompt, onProgress)
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

   async _callDeepSeek(apiKey: string, baseUrl: string, systemPrompt: string, userPrompt: string, onProgress?: (p: number) => void): Promise<any> {
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
               response_format: { type: 'json_object' },
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
         return JSON.parse(contentStr)

      } catch (error: any) {
         console.error('LLM Service Error:', error)
         if (error.name === 'AbortError') throw new Error('Request timed out')
         throw error
      }
   },
}
