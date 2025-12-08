
import nlp from 'compromise'

/**
 * Returns the lemma (base form) of a word.
 * e.g., "decided" -> "decide", "books" -> "book"
 * If no lemma is found or word is already base, returns the original word (lowercase).
 */
export const getLemma = (word: string): string => {
    if (!word) return ''

    const doc = nlp(word)
    doc.compute('root')

    // Attempt to get verb infinitive
    const verbRoot = doc.verbs().toInfinitive().text()
    if (verbRoot) return verbRoot.toLowerCase()

    // Attempt to get noun singular
    const nounRoot = doc.nouns().toSingular().text()
    if (nounRoot) return nounRoot.toLowerCase()

    return word.toLowerCase()
}
