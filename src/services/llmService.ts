import { Word, Setting, WordStudyItem } from './db'
import i18n from '../i18n/config'
import { PROMPTS } from './prompts'
import { parseIncrementalJson } from '../utils/jsonParser'

export interface GeneratedArticleData {
   title: string
   topic?: string
   difficulty_assessed?: string
   content: string
   targetWords: string[]
   word_study?: WordStudyItem[]
}

// Partial interface for streaming
export interface PartialArticleData {
   title?: string
   content?: string
   targetWords?: string[]
   topic?: string
   word_study?: any[]
   difficulty_assessed?: string
}

export const llmService = {

   // Streaming Article Generation
   async generateArticleStream(
      words: Word[],
      settings: Setting,
      _onProgress?: (progress: number) => void,
      onPartialData?: (data: PartialArticleData) => void,
      signal?: AbortSignal
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

      let fullBuffer = '';

      const onToken = (token: string) => {
         fullBuffer += token;
         // Incremental Parsing
         if (onPartialData) {
            const partial = this._parsePartialJson(fullBuffer);
            if (partial) {
               onPartialData(partial);
            }
         }
      }

      await this._callDeepSeekStream(
         apiKey,
         baseUrl,
         systemPrompt,
         userPrompt,
         onToken,
         signal
      );

      // Final parse check
      let rawData: any = {};
      try {
         // Try to parse the complete buffer finally
         // Sometimes stream ends but buffer has markdown wrappers
         rawData = JSON.parse(fullBuffer.replace(/```json\n?|\n?```/g, ''));
      } catch (e) {
         console.warn('Final JSON parse failed, relying on last partial parse', e);
         rawData = this._parsePartialJson(fullBuffer) || {};
      }

      // Reuse adaptation logic from generateArticleOnly
      let finalTargetWords: string[] = []
      if (Array.isArray(rawData.targetWords)) {
         finalTargetWords = rawData.targetWords
      } else if (Array.isArray(rawData.word_study)) {
         finalTargetWords = rawData.word_study.map((item: any) => item.word).filter((w: any) => typeof w === 'string')
      } else {
         finalTargetWords = words.map(w => w.spelling)
      }

      return {
         title: rawData.title || 'Untitled',
         content: rawData.content || fullBuffer, // Fallback to raw buffer if content missing
         targetWords: finalTargetWords,
         topic: rawData.topic,
         difficulty_assessed: rawData.difficulty_assessed,
         word_study: rawData.word_study
      }
   },

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
      settings: Setting,
      onToken?: (token: string) => void,
      signal?: AbortSignal
   ): Promise<string> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || '/api/deepseek/v1'

      if (!apiKey) throw new Error(i18n.t('common:common.apiKeyMissing'))

      const systemPrompt = PROMPTS.SENTENCE_ANALYSIS.SYSTEM_PROMPT;
      const userPrompt = `Analyze this sentence: "${sentence}"`

      if (onToken) {
         return this._callDeepSeekStream(apiKey, baseUrl, systemPrompt, userPrompt, onToken, signal)
      }

      return this._callDeepSeek(apiKey, baseUrl, systemPrompt, userPrompt, undefined, false)
   },

   _parsePartialJson(buffer: string): PartialArticleData | null {
      return parseIncrementalJson(buffer);
   },

   // 流式调用 DeepSeek
   async _callDeepSeekStream(
      apiKey: string,
      baseUrl: string,
      systemPrompt: string,
      userPrompt: string,
      onToken: (token: string) => void,
      signal?: AbortSignal
   ): Promise<string> {
      console.log('Starting LLM streaming...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      // Merge signals if needed. For now, if external signal is provided, we prefer it,
      // but we technically should respect both timeout AND user abort.
      // A simple way to respect both is to add event listener to external signal to abort our local controller.
      if (signal) {
         signal.addEventListener('abort', () => controller.abort())
      }

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
               stream: true
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

         const decoder = new TextDecoder()
         let fullText = ''
         let buffer = ''

         while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            const lines = buffer.split('\n')
            // keep the last likely incomplete line in buffer
            buffer = lines.pop() || ''

            for (const line of lines) {
               const trimmed = line.trim()
               if (!trimmed || trimmed === 'data: [DONE]') continue

               if (trimmed.startsWith('data: ')) {
                  try {
                     const jsonStr = trimmed.slice(6)
                     const data = JSON.parse(jsonStr)
                     const token = data.choices[0]?.delta?.content || ''
                     if (token) {
                        onToken(token)
                        fullText += token
                     }
                  } catch (e) {
                     console.warn('Stream parse invalid JSON:', trimmed, e)
                  }
               }
            }
         }

         return fullText

      } catch (error: any) {
         console.error('LLM Streaming Error:', error)
         if (error.name === 'AbortError') throw new Error('Request timed out')
         throw error
      }
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
         // 1. 发起 API 请求
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
               // 如果预期 JSON，强制模型输出 JSON 格式
               response_format: expectJson ? { type: 'json_object' } : undefined,
            }),
            signal: controller.signal
         })

         clearTimeout(timeoutId)

         // 2. 错误处理
         if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(`API Error: ${response.status} ${err.error?.message || ''}`)
         }

         // 3. 直接等待完整响应 (前端 Loading 组件会展示模拟进度)
         // 放弃了之前的"字节流伪进度"，改用 Loading 组件内部的假进度算法，更平滑
         const data = await response.json()

         // 4. 解析内容
         const contentStr = data.choices[0]?.message?.content
         if (!contentStr) throw new Error('Empty response from API')

         // 5. 标记完成
         onProgress?.(100)

         if (expectJson) {
            // DeepSeek 在 json_object 模式下有时会返回 markdown code block，需要剥离
            // 虽然 json_object 模式通常只返回 json，但做一层防御更好
            // 这里假设它返回的是纯 JSON 字符串，直接 parse
            try {
               return JSON.parse(contentStr)
            } catch {
               console.warn('JSON Parse failed, trying to strip markdown...')
               // 简单的 markdown strip
               const cleanStr = contentStr.replace(/```json\n?|\n?```/g, '')
               return JSON.parse(cleanStr)
            }
         }
         return contentStr

      } catch (error: any) {
         console.error('LLM Service Error:', error)
         if (error.name === 'AbortError') throw new Error('Request timed out')
         throw error
      }
   },
}
