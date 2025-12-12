import { Word, Setting, WordStudyItem } from './db'
import i18n from '../i18n/config'

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
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'

      if (!apiKey) throw new Error(i18n.t('common:common.apiKeyMissing'))

      const wordList = words.map((w) => w.spelling).join(', ')
      const lengthPrompt = settings.articleLenPref === 'short' ? '400 words' : settings.articleLenPref === 'long' ? '800 words' : '600 words'
      const difficultyLevel = settings.difficultyLevel || 'L2'

      // 1. 定义你的基础映射 (保留你原来的逻辑)
      const cefrLevel = difficultyLevel === 'L1' ? 'A1' : difficultyLevel === 'L2' ? 'A2' : 'B1';

      // 2. 新增：定义针对大模型的“详细指导语” (中文版)
      // 这段话告诉大模型：这个难度在中考体系里到底算什么水平？
      const difficultyMap = {
         'L1': `初学者基础水平 (初一 / CEFR A1)。
                  - 句法结构：短小、简单的句子 (主语+谓语+宾语)，避免复杂从句。
                  - 词汇要求：仅限极高频的基础词汇。
                  - 教学目标：建立初学者的阅读信心，无障碍阅读。`,

         'L2': `标准中考水平 (初二至初三 / CEFR A2)。
                  - 句法结构：简单句与并列句混合。适度引入基础从句 (如时间状语从句、条件状语从句)。
                  - 词汇要求：严格覆盖中考核心词汇 (1600词范围)。
                  - 教学目标：完全对标中考阅读理解真题的平均难度。`,

         'L3': `进阶拔高/压轴水平 (准高中 / CEFR B1)。
                  - 句法结构：使用复杂句式，包含嵌套从句 (如定语从句、分词作状语、名词性从句)。
                  - 词汇要求：词汇更丰富，可包含适量的抽象概念或熟词僻义。
                  - 教学目标：挑战高分段学生，旨在拿下中考里最具区分度的压轴难题。`
      }

      // 3. 获取当前对应的描述
      const levelDescription = difficultyMap[difficultyLevel] || difficultyMap['L2'];

      const systemPrompt = `
         # Role (角色设定)
         你是一位专注于**中国中考英语（Zhongkao）**的资深英语教师。
         你深谙中国《义务教育英语课程标准》（新课标），善于编写符合中国初中生认知水平的高质量英文阅读素材。

         # Parameters (参数设置)
         - **目标单词 (Target Words)**: [${wordList}]
         - **目标篇幅 (Target Length)**: 约 ${lengthPrompt} 词
         - **难度等级 (Difficulty)**: ${difficultyLevel} (参考标准: ${cefrLevel})

         # Instructions (执行指令)

         1. **话题选择 (Topic Selection)**
            - 请选择一个高度契合中考命题趋势的话题（例如：校园生活、个人成长、中国传统文化、人与自然、科技进步）。
            - **注意**：文章正文必须使用**英语**撰写。

         2. **难度与复杂度控制 (Difficulty & Complexity Control)** [关键]
            - **具体约束标准**: ${levelDescription}
            - 请务必**严格遵循**上述描述来调整句子的长短、结构复杂度和逻辑抽象度。
            - 确保文章既不超纲（太难），也不过于幼稚（太简单）。

         3. **词汇控制 (Vocabulary Control)**
            - **目标单词**: 必须自然地融入上下文中，并强制使用 **双星号** (例如 **word**) 进行加粗标记。
            - **非目标单词**: 除目标词外，其余词汇请严格限制在 **${cefrLevel}** 词汇范围内，严禁使用生僻词。

         4. **价值观 (Values)**
            - 文章内容必须积极向上，符合中国青少年的价值观（如坚韧、友善、爱国、创新）。

         5. **Word Study Analysis (核心词汇解析)** [CRITICAL]
            - For the "word_study" array in JSON, you MUST analyze each **Target Word** used in your article.
            - **Meaning in Context**: Provide the specific Chinese meaning *as used in the article*.
            - **Example**: If "light" is used as a verb ("ignite"), the meaning MUST be "点燃" (v.), NOT "光线" (n.).

         # Output Format (输出格式)
         请**仅**返回一个合法的 JSON 对象（不要使用 Markdown 代码块）：
         {
         "title": "文章标题 (英文)",
         "topic": "主题分类 (英文)",
         "difficulty_assessed": "${difficultyLevel}",
         "content": "文章正文 (英文，目标单词需加粗)",
         "word_study": [ 
            { 
               "word": "目标单词", 
               "part_of_speech": "词性 (如 n./v.)", 
               "meaning_in_context": "该词在当前上下文中的中文释义" 
            } 
         ]
         }
         `;
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
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1';
      const difficultyLevel = settings.difficultyLevel || 'L2';

      // 1. 重新设计的题型配置 (科学对标中考)
      const questionConfig = {
         'L1': {
            // L1 目标：建立信心，巩固记忆
            // 题型：释义连线(最简单) + 原文填空(回顾) + 听音选词
            description: '3 Definition Choice (English definition -> Word) + 3 Cloze (From article, Choice) + 2 Audio Selection + 2 Spelling (Easy, complete the word)'
         },
         'L2': {
            // L2 目标：中考实战，语境运用
            // 题型：新语境选词(考查迁移能力) + 词形变换(中考必考，如 act -> active) + 听写
            description: '4 Contextual Choice (New sentences, distinct contexts) + 3 Word Form (Derivation) + 3 Cloze (From article) + 2 Audio Dictation'
         },
         'L3': {
            // L3 目标：拉开分差，深度掌握
            // 题型：拼写(无提示) + 熟词僻义/复杂语境 + 词形变换(难)
            description: '4 Spelling Input (No options) + 4 Contextual Choice (Advanced/Abstract contexts) + 4 Word Form (Complex derivation)'
         }
      };


      const config = questionConfig[difficultyLevel] || questionConfig['L2'];

      const difficultyContextMap = {
         'L1': `难度目标：初学者基础水平 (初一)。
                - 干扰项设计：干扰性较弱，错误选项特征明显，易于排除（例如词性不同或语义完全无关）。
                - 设问风格：提问简单直白，不设逻辑陷阱。`,

         'L2': `难度目标：标准中考水平 (初二至初三)。
                - 干扰项设计：必须具备**相同词性**，且具有一定的迷惑性（常规近义词或形近词）。
                - 解题逻辑：重点考察**语境理解**，无法仅凭单词中文释义直接选出，必须结合上下文逻辑。`,

         'L3': `难度目标：进阶/压轴水平 (拔高/区分度题)。
                - 干扰项设计：**强干扰性**，包含高阶近义词辨析、熟词僻义或语法陷阱。
                - 解题逻辑：考察词义的细微差别 (Nuance)、抽象概念理解以及在复杂句法结构下的逻辑推断。`
      }

      const difficultyContext = difficultyContextMap[difficultyLevel] || difficultyContextMap['L2']

      // 2. 升级版 Prompt：增加中考特有题型规则
      const systemPrompt = `
         # Role
         你是一位**中国中考英语命题组组长**。你的任务是根据文章和单词，编制一份具有**区分度**和**科学性**的测验题。

         # Difficulty Profile (难度设定)
         **Level**: ${difficultyLevel}
         **Guideline**: ${difficultyContext}  <-- 关键：把具体的出题标准告诉它

         # Task 1: Reading Comprehension (4 Questions)
         生成 4 道单项选择题，必须严格覆盖以下四个中考考点（维度）：
         1. **Fact Retrieval (细节题)**: 直接从文中提取信息。
         2. **Main Idea (主旨题)**: 归纳文章标题或中心思想。
         3. **Inference (推断题)**: 基于事实进行逻辑推断（不可直接找到答案）。
         4. **Vocabulary/Structure (词义/句意题)**: 猜测文中画线词的意思或指代关系。

         # Task 2: Vocabulary Quiz (Strict Configuration)
         请按照以下配置生成词汇题：
         **当前配置**: ${config.description}

         ## 核心题型生成规则 (Critical Rules):

         1. **Word Form (词形变换)** [中考重点]:
            - 给出目标词的**词根**（如 *success*），给出一个**新句子**挖空。
            - 要求学生填入**派生词**（如 *successful/successfully*）。
            - **JSON Format**: type="input", subType="word_form", question="The sentence with ____", hint="Root word: success"

         2. **Contextual Choice (语境选词)**:
            - 必须编写**全新的句子**（New Sentences），不能抄袭原文。
            - 考察学生在脱离文章后是否真正掌握了单词用法。
            - 干扰项（Options）必须是**词性相同**且**语义相关**的单词。

         3. **Cloze (原文填空)**:
            - 必须**直接摘录原文句子**，挖去目标词。
            - 考察对文章的所谓“语感”回顾。

         4. **Definition Choice (英英释义)**:
            - Question 是英文释义，Answer 是目标单词。

         5. **Spelling Input (拼写)**:
            - type="input"。给出中文释义或英文提示，要求用户输入单词拼写。

         ## 通用约束:
         - **目标词**: 题目必须优先围绕 Target Words: [${words.map(w => w.spelling).join(', ')}]
         - **解析 (Explanation)**: 所有题目必须提供中文解析，特别是“词形变换”要解释语法原理（例如：这里修饰动词，所以用副词形式）。

         # Output Format (JSON Only)
         返回标准 JSON 对象，无 Markdown：
         {
         "readingQuestions": [
            {
               "type": "multiple_choice",
               "question": "...",
               "options": ["A", "B", "C", "D"],
               "answer": "Option content",
               "explanation": "中文解析"
            }
         ],
         "vocabularyQuestions": [
            {
               "type": "multiple_choice" | "input",
               "subType": "word_form" | "contextual" | "cloze" | "definition" | "spelling" | "audio",
               "question": "Question text (or sentence with ____)",
               "hint": "Root word for word_form / Definition for spelling",
               "options": ["A", "B", "C", "D"], // 仅选择题需要
               "answer": "Correct Answer",
               "phonetic": "/.../", // 仅 Audio 题需要
               "explanation": "中文解析 (Explanation is mandatory)"
            }
         ]
         }
`;

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
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'

      if (!apiKey) throw new Error(i18n.t('common:common.apiKeyMissing'))

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

   //英语长难句分析
   async analyzeSentence(
      sentence: string,
      settings: Setting
   ): Promise<string> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'

      if (!apiKey) throw new Error(i18n.t('common:common.apiKeyMissing'))

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
