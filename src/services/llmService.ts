import { Word, Setting } from './db'
import { GeneratedContent } from './mockLLMService'

const SYSTEM_PROMPT = `
You are an expert English teacher for middle school students. 
Your task is to write a short, engaging story or article that incorporates a specific list of vocabulary words.
The article should be appropriate for the student's reading level (CEFR A2-B1).
You must also generate 2 reading comprehension questions.

Output MUST be valid JSON with the following structure:
{
  "title": "Title of the article",
  "content": "The article content in Markdown format. IMPORTANT: You MUST wrap the target words in **double asterisks** to bold them (e.g., **apple**).",
  "questions": [
    {
      "id": "q1",
      "type": "choice",
      "stem": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The correct option text (must match one of the options exactly)"
    }
  ]
}
`

export const llmService = {
    async generateArticle(words: Word[], settings: Setting): Promise<GeneratedContent> {
        const apiKey = settings.apiKey
        const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1'

        if (!apiKey) {
            throw new Error('API Key is missing. Please configure it in Settings.')
        }

        const wordList = words.map((w) => w.spelling).join(', ')
        const lengthPrompt = settings.articleLenPref === 'short' ? '150 words' : settings.articleLenPref === 'long' ? '300 words' : '200 words'

        const userPrompt = `
Please write an article using the following target words: ${wordList}.
Target length: approximately ${lengthPrompt}.
Ensure the story is coherent and the usage of words is natural.
Remember to return ONLY valid JSON.
`

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'deepseek-chat', // Or 'deepseek-coder', or user configurable
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.7,
                    response_format: { type: 'json_object' }, // If supported, otherwise rely on prompt
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`)
            }

            const data = await response.json()
            const contentStr = data.choices[0]?.message?.content

            if (!contentStr) {
                throw new Error('Empty response from API')
            }

            // Parse JSON content
            try {
                const parsed: GeneratedContent = JSON.parse(contentStr)
                // Validate structure briefly
                if (!parsed.title || !parsed.content || !Array.isArray(parsed.questions)) {
                    throw new Error('Invalid JSON structure')
                }
                return parsed
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError, contentStr)
                throw new Error('Failed to parse generated content. The AI did not return valid JSON.')
            }

        } catch (error) {
            console.error('LLM Service Error:', error)
            throw error
        }
    },
}
