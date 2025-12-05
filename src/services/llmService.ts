import { Word, Setting } from './db'
import { GeneratedContent } from './mockLLMService'

const SYSTEM_PROMPT = `
You are an expert English teacher for middle school students preparing for the Zhongkao (Chinese middle school entrance exam).
Your task is to write a short, engaging story or article that incorporates a specific list of vocabulary words.

IMPORTANT: You MUST return ONLY valid JSON. Do not include any explanatory text before or after the JSON.

The JSON structure must be:
{
  "title": "Title of the article",
  "content": "The article content in Markdown format. **CRITICAL**: You MUST wrap ALL target words in **double asterisks** to bold them (e.g., **ambitious**).",
  "readingQuestions": [
    {
      "id": "r1",
      "type": "contextual",
      "stem": "Question text about the article content?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The correct option text"
    }
    // ... exactly 4 reading comprehension questions
  ],
  "vocabularyQuestions": [
    // Question configuration varies by difficulty level (see below)
  ]
}

VOCABULARY QUESTIONS CONFIGURATION BY DIFFICULTY LEVEL:

=== L1 (Basic/Grade 7) - Total 10 Questions ===
1. Cloze (3 questions) - type: "cloze"
   - Use sentences FROM the article, blank out the target word
   - Provide 4 options (correct + 3 distractors with same part of speech)
   
2. Definition (3 questions) - type: "definition"
   - Ask for the correct meaning of the word
   - Provide bilingual options: "中文含义 (English equivalent)"
   - Example: "有雄心的，野心勃勃的 (having a strong desire to succeed)"
   
3. Audio Selection (2 questions) - type: "audio"
   - Provide the phonetic transcription in "phonetic" field
   - Ask user to choose correct spelling from 4 similar options
   - Options should have slight spelling variations
   
4. Matching (1 set of 3 pairs) - type: "matching"
   - Provide "pairs" array with word-definition pairs
   - Definitions should be simple English explanations
   - answer should be array of "word-defN" format

=== L2 (Intermediate/Grade 8) - Total 10 Questions ===
1. Contextual Application (4 questions) - type: "contextual"
   - Create NEW sentences (NOT from article) showing the word in context
   - Test understanding and application ability
   
2. Spelling Input (2 questions) - type: "spelling"
   - Provide English definition and phonetic
   - User must TYPE the spelling (no options field)
   - Include "phonetic" field
   
3. Cloze (2 questions) - type: "cloze"
   - Use sentences FROM the article
   
4. Synonym/Antonym (1 question) - type: "synonym"
   - Ask for synonym or antonym with 4 options
   
5. Audio Dictation Choice (1 question) - type: "audio"
   - Provide phonetic transcription
   - Options should be different word forms (e.g., ambitious, ambitiously, ambition, ambiance)

=== L3 (Advanced/Zhongkao) - Total 12 Questions ===
1. Spelling Input (3 questions) - type: "spelling"
   - Pure English definition, NO Chinese
   - Provide phonetic transcription
   - No options field
   
2. Contextual Application (3 questions) - type: "contextual"
   - Complex sentences with multiple clauses
   - Advanced context understanding required
   
3. Word Form Transformation (2 questions) - type: "wordForm"
   - Give sentence with word in parentheses  
   - User fills in correct form (e.g., "her _______ (ambition) nature" → "ambitious")
   - No options field
   
4. Audio Complete Dictation (2 questions) - type: "audio"
   - Provide phonetic only
   - User must TYPE spelling after listening (no options)
   
5. Synonym/Antonym (1 question) - type: "synonym"
   - Can ask for either synonym or antonym
   
6. Matching (1 set of 3 pairs) - type: "matching"
   - Advanced English definitions
   - More complex vocabulary in definitions

CRITICAL REQUIREMENTS FOR ALL LEVELS:
- Distractors MUST have the same part of speech as the correct answer
- For cloze questions, sentences MUST be taken directly from the article
- For contextual questions, sentences MUST be NEW (not from article)
- For audio questions, always include "phonetic" field with IPA notation
- For matching questions, use "pairs" array and answer as string array
- For spelling/wordForm questions, do NOT include "options" field
- Each vocabulary question MUST have a "targetWord" field

DIFFICULTY-SPECIFIC ARTICLE REQUIREMENTS:
- L1: Simple vocabulary, clear structure
- L2: Moderate complexity, varied sentence patterns
- L3: Advanced vocabulary, complex sentences
`

export const llmService = {
   async generateArticle(
      words: Word[],
      settings: Setting,
      onProgress?: (progress: number) => void
   ): Promise<GeneratedContent> {
      const apiKey = settings.apiKey
      const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'

      if (!apiKey) {
         throw new Error('API Key is missing. Please configure it in Settings.')
      }

      const wordList = words.map((w) => w.spelling).join(', ')
      const lengthPrompt = settings.articleLenPref === 'short' ? '400 words' : settings.articleLenPref === 'long' ? '800 words' : '600 words'

      // Validate and normalize difficulty level
      let difficultyLevel = settings.difficultyLevel
      if (!['L1', 'L2', 'L3'].includes(difficultyLevel)) {
         console.warn(`Invalid difficulty level "${difficultyLevel}", defaulting to L2`)
         difficultyLevel = 'L2'
      }

      const cefrLevel = difficultyLevel === 'L1' ? 'A1' : difficultyLevel === 'L2' ? 'A2' : 'B1'

      // 根据难度等级确定题量配置
      const questionConfig = {
         'L1': { total: 10, description: 'Cloze(3) + Definition(3) + Audio Selection(2) + Matching(1 set of 3 pairs)' },
         'L2': { total: 10, description: 'Contextual(4) + Spelling Input(2) + Cloze(2) + Synonym/Antonym(1) + Audio Dictation(1)' },
         'L3': { total: 12, description: 'Spelling Input(3) + Contextual(3) + Word Form(2) + Audio Dictation(2) + Synonym/Antonym(1) + Matching(1 set of 3 pairs)' }
      }

      const config = questionConfig[difficultyLevel]

      const userPrompt = `
Please write an article using the following target words: ${wordList}.
Difficulty Level: ${difficultyLevel} (CEFR ${cefrLevel})
Target length: approximately ${lengthPrompt}.

IMPORTANT REQUIREMENTS:
1. Generate EXACTLY 4 reading comprehension questions (type: "contextual")
2. Generate EXACTLY ${config.total} vocabulary questions following this configuration:
   ${config.description}
3. Ensure all target words are wrapped in **double asterisks** like **word**
4. Follow the exact question type distribution specified in the system prompt for ${difficultyLevel}
5. For audio questions, provide proper phonetic transcriptions using IPA notation
6. For matching questions, create a "pairs" array and answer as string array
7. For spelling/wordForm questions, do NOT include "options" field
8. Return ONLY valid JSON, no additional text
`

      try {
         console.log('Starting LLM generation...', { baseUrl, difficultyLevel })
         console.time('⏱️ Total Generation Time')

         const startTime = performance.now()
         const timings: Record<string, number> = {}

         const controller = new AbortController()
         const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout

         console.log('📤 Sending request to API...')
         const requestStartTime = performance.now()

         const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
               model: 'deepseek-chat',
               messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  { role: 'user', content: userPrompt },
               ],
               temperature: 0.7,
               response_format: { type: 'json_object' },
            }),
            signal: controller.signal
         })

         const responseReceivedTime = performance.now()
         timings['Request → Response Headers'] = responseReceivedTime - requestStartTime
         console.log(`✅ Response headers received in ${timings['Request → Response Headers'].toFixed(0)}ms`)

         clearTimeout(timeoutId)

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('API Error Response:', errorData)
            throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`)
         }

         // Read response with progress tracking
         console.log('📥 Downloading response body...')
         const downloadStartTime = performance.now()

         const reader = response.body?.getReader()
         if (!reader) {
            throw new Error('Response body is not readable')
         }

         const contentLength = Number(response.headers.get('Content-Length')) || 50000 // Estimate if not provided
         console.log(`📊 Expected content length: ${contentLength} bytes`)

         let receivedLength = 0
         const chunks: Uint8Array[] = []
         let lastProgressLog = 0

         while (true) {
            const { done, value } = await reader.read()

            if (done) break

            chunks.push(value)
            receivedLength += value.length

            // Calculate and report progress (0-99%, saving 100% for parsing)
            const downloadProgress = Math.min((receivedLength / contentLength) * 99, 99)
            onProgress?.(downloadProgress)

            // Log progress every 10%
            if (Math.floor(downloadProgress / 10) > lastProgressLog) {
               lastProgressLog = Math.floor(downloadProgress / 10)
               const elapsed = performance.now() - downloadStartTime
               console.log(`  📦 Downloaded ${Math.round(downloadProgress)}% (${receivedLength} bytes) in ${elapsed.toFixed(0)}ms`)
            }
         }

         const downloadEndTime = performance.now()
         timings['Download Body'] = downloadEndTime - downloadStartTime
         console.log(`✅ Download completed: ${receivedLength} bytes in ${timings['Download Body'].toFixed(0)}ms`)
         console.log(`   Average speed: ${(receivedLength / 1024 / (timings['Download Body'] / 1000)).toFixed(2)} KB/s`)

         // Combine chunks
         console.log('🔧 Combining chunks...')
         const combineStartTime = performance.now()

         const chunksAll = new Uint8Array(receivedLength)
         let position = 0
         for (const chunk of chunks) {
            chunksAll.set(chunk, position)
            position += chunk.length
         }

         const combineEndTime = performance.now()
         timings['Combine Chunks'] = combineEndTime - combineStartTime
         console.log(`✅ Chunks combined in ${timings['Combine Chunks'].toFixed(0)}ms`)

         // Decode and parse
         console.log('🔤 Decoding text...')
         const decodeStartTime = performance.now()

         const responseText = new TextDecoder('utf-8').decode(chunksAll)

         const decodeEndTime = performance.now()
         timings['Decode Text'] = decodeEndTime - decodeStartTime
         console.log(`✅ Text decoded in ${timings['Decode Text'].toFixed(0)}ms`)

         console.log('📋 Parsing outer JSON...')
         const parseOuterStartTime = performance.now()

         const data = JSON.parse(responseText)

         const parseOuterEndTime = performance.now()
         timings['Parse Outer JSON'] = parseOuterEndTime - parseOuterStartTime
         console.log(`✅ Outer JSON parsed in ${timings['Parse Outer JSON'].toFixed(0)}ms`)

         const contentStr = data.choices[0]?.message?.content

         if (!contentStr) {
            throw new Error('Empty response from API')
         }

         // Parse JSON content
         console.log('📄 Parsing content JSON...')
         const parseContentStartTime = performance.now()

         try {
            const parsed: GeneratedContent = JSON.parse(contentStr)

            const parseContentEndTime = performance.now()
            timings['Parse Content JSON'] = parseContentEndTime - parseContentStartTime
            console.log(`✅ Content JSON parsed in ${timings['Parse Content JSON'].toFixed(0)}ms`)

            // Validate structure briefly
            if (!parsed.title || !parsed.content || !Array.isArray(parsed.readingQuestions) || !Array.isArray(parsed.vocabularyQuestions)) {
               throw new Error('Invalid JSON structure: Missing required fields')
            }

            // Report 100% completion
            onProgress?.(100)

            const totalTime = performance.now() - startTime
            timings['TOTAL'] = totalTime

            // Summary
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('📊 Performance Summary:')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            Object.entries(timings).forEach(([stage, time]) => {
               const percentage = stage === 'TOTAL' ? 100 : (time / totalTime * 100)
               console.log(`  ${stage.padEnd(25)}: ${time.toFixed(0).padStart(6)}ms (${percentage.toFixed(1)}%)`)
            })
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

            console.timeEnd('⏱️ Total Generation Time')

            return parsed
         } catch (parseError) {
            console.error('JSON Parse Error:', parseError, contentStr.substring(0, 500))
            throw new Error('Failed to parse generated content. The AI did not return valid JSON.')
         }

      } catch (error: any) {
         console.error('LLM Service Error:', error)
         console.timeEnd('⏱️ Total Generation Time')
         if (error.name === 'AbortError') {
            throw new Error('Request timed out after 60 seconds')
         }
         throw error
      }
   },
}
