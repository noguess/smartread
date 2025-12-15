
import { Question, MultipleChoiceQuestion, ClozeQuestion, MatchingQuestion, GenericQuestion } from './db'

export function isMultipleChoice(q: Question): q is MultipleChoiceQuestion {
    return ['multiple_choice', 'audioSelection', 'synonym', 'contextual'].includes(q.type)
}

export function isCloze(q: Question): q is ClozeQuestion {
    return ['cloze', 'spelling', 'wordForm'].includes(q.type)
}

export function isMatching(q: Question): q is MatchingQuestion {
    return ['matching', 'synonymAntonym'].includes(q.type)
}

export function isGeneric(q: Question): q is GenericQuestion {
    return !isMultipleChoice(q) && !isCloze(q) && !isMatching(q)
}
