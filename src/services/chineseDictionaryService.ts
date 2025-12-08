
export interface ChineseDefinition {
    definition: string
    phonetic?: string
}

export const chineseDictionaryService = {
    async getDefinition(word: string): Promise<ChineseDefinition | null> {
        try {
            // Using the proxy configured in vite.config.ts
            // /api/youdao -> https://dict.youdao.com
            const response = await fetch(`/api/youdao/suggest?num=1&doctype=json&q=${encodeURIComponent(word)}`)

            if (!response.ok) {
                throw new Error(`Chinese Dictionary API error: ${response.statusText}`)
            }

            const data = await response.json()

            // Validate response structure
            if (data?.result?.code === 200 && data?.data?.entries?.length > 0) {
                const entry = data.data.entries[0]
                return {
                    definition: entry.explain || '暂无释义',
                    phonetic: undefined // Youdao suggest API often doesn't return phonetic in this lightweight endpoint
                }
            }

            return null
        } catch (error) {
            console.error('Error fetching Chinese definition:', error)
            return null
        }
    }
}
