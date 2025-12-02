export interface DictionaryEntry {
    word: string
    phonetic?: string
    phonetics: {
        text?: string
        audio?: string
    }[]
    meanings: {
        partOfSpeech: string
        definitions: {
            definition: string
            example?: string
            synonyms: string[]
            antonyms: string[]
        }[]
    }[]
    sourceUrls: string[]
}

export const dictionaryService = {
    async getDefinition(word: string): Promise<DictionaryEntry[]> {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
            if (!response.ok) {
                throw new Error(`Dictionary API error: ${response.statusText}`)
            }
            const data = await response.json()
            return data
        } catch (error) {
            console.error('Error fetching dictionary data:', error)
            throw error
        }
    },
}
