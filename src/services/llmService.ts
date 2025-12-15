import { Word, Setting, WordStudyItem } from './db'
import i18n from '../i18n/config'
import { PROMPTS } from './prompts'

export interface GeneratedArticleData {
   title: string
   topic?: string
   difficulty_assessed?: string
   content: string
   targetWords: string[]
   word_study?: WordStudyItem[]
}

export const llmService = {

   //根据单词列表生成文章
   async generateArticleOnly(
      words: Word[],
      settings: Setting,
      onProgress?: (progress: number) => void
   ): Promise<GeneratedArticleData> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || '/api/deepseek/v1'

      if (!apiKey) throw new Error(i18n.t('common:common.apiKeyMissing'))

      const wordList = words.map((w) => w.spelling).join(', ')
      const lengthPrompt = settings.articleLenPref === 'short' ? '400 words' : settings.articleLenPref === 'long' ? '800 words' : '600 words'
      const difficultyLevel = settings.difficultyLevel || 'L2'

      const cefrLevel = difficultyLevel === 'L1' ? 'A1' : difficultyLevel === 'L2' ? 'A2' : 'B1';

      const difficultyMap = PROMPTS.ARTICLE_GENERATION.getDifficultyMap() as Record<string, string>;
      const levelDescription = difficultyMap[difficultyLevel] || difficultyMap['L2'];

      const systemPrompt = PROMPTS.ARTICLE_GENERATION.getSystemPrompt(
         wordList,
         lengthPrompt,
         difficultyLevel,
         cefrLevel,
         levelDescription
      );

      const userPrompt = `请根据${wordList}生成文章吧`
      const rawData = await this._callDeepSeek(apiKey, baseUrl, systemPrompt, userPrompt, onProgress)

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

   //根据文章内容生成测试题
   async generateQuizForArticle(
      articleContent: string,
      words: Word[],
      settings: Setting,
      onProgress?: (progress: number) => void
   ): Promise<{ readingQuestions: any[]; vocabularyQuestions: any[] }> {
      const apiKey = settings.apiKey;
      const baseUrl = settings.apiBaseUrl || '/api/deepseek/v1';
      const difficultyLevel = settings.difficultyLevel || 'L2';

      const questionConfig = PROMPTS.QUIZ_GENERATION.getQuestionConfig() as Record<string, { description: string }>;
      const config = questionConfig[difficultyLevel] || questionConfig['L2'];

      const difficultyContextMap = PROMPTS.QUIZ_GENERATION.getDifficultyContextMap() as Record<string, string>;
      const difficultyContext = difficultyContextMap[difficultyLevel] || difficultyContextMap['L2']

      const wordList = words.map(w => w.spelling).join(', ');
      const systemPrompt = PROMPTS.QUIZ_GENERATION.getSystemPrompt(
         difficultyLevel,
         difficultyContext,
         config.description,
         wordList
      );

      const userPrompt = `
      **ARTICLE CONTENT**:
      ${articleContent}

      **TARGET WORDS LIST**:
      ${JSON.stringify(words.map(w => w.spelling))}

      **COMMAND**:
            Generate the quiz JSON now.
      `;

      const json = await this._callDeepSeek(apiKey, baseUrl, systemPrompt, userPrompt, onProgress);

      // Normalize fields (LLM prompt uses "question" but frontend expects "stem")
      // and inject IDs locally to ensure frontend stability
      const processQuestions = (questions: any[], prefix: string) => {
         if (!questions || !Array.isArray(questions)) return
         questions.forEach((q: any, i: number) => {
            // 1. Normalize stem
            if (!q.stem && q.question) {
               q.stem = q.question
            }
            // 2. Inject ID
            if (!q.id) {
               q.id = `${prefix}${i}`
            }
            // 3. Fix LLM Typos
            if (q.type === 'multiple_oice') {
               q.type = 'multiple_choice'
            }
         })
      }

      processQuestions(json.readingQuestions, 'r')
      processQuestions(json.vocabularyQuestions, 'v')

      return json;
   },

   //获取单词的中文释义
   async getChineseDefinition(
      word: string,
      settings: Setting
   ): Promise<{ definition: string; phonetic: string }> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || '/api/deepseek/v1'

      if (!apiKey) throw new Error(i18n.t('common:common.apiKeyMissing'))

      const systemPrompt = PROMPTS.DICTIONARY.SYSTEM_PROMPT;
      const userPrompt = `Define the word: "${word}"`

      return this._callDeepSeek(apiKey, baseUrl, systemPrompt, userPrompt)
   },

   //英语长难句分析
   async analyzeSentence(
      sentence: string,
      settings: Setting
   ): Promise<string> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || '/api/deepseek/v1'

      if (!apiKey) throw new Error(i18n.t('common:common.apiKeyMissing'))

      const systemPrompt = PROMPTS.SENTENCE_ANALYSIS.SYSTEM_PROMPT;
      const userPrompt = `Analyze this sentence: "${sentence}"`

      return this._callDeepSeek(apiKey, baseUrl, systemPrompt, userPrompt, undefined, false)
   },

   //调用deepseek
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
