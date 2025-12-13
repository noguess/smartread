
import QuizView from '../components/reading/QuizView'
import GenerationLoading from '../components/reading/GenerationLoading'
import { GeneratedContent } from '../services/mockLLMService' // Or separate type

interface QuizPageProps {
    isGenerating: boolean
    progress: number
    articleData: GeneratedContent | null
    onQuizSubmit: (answers: { reading: Record<string, string>; vocabulary: Record<string, string | string[]> }) => void
    isSubmitting: boolean
    onExit: () => void
    readOnly?: boolean
    quizResult?: { score: number; total: number; message?: string, stats?: any }
}

export default function QuizPage({
    isGenerating,
    progress,
    articleData,
    onQuizSubmit,
    isSubmitting,
    onExit,
    readOnly,
    quizResult
}: QuizPageProps) {
    if (isGenerating) {
        return <GenerationLoading mode="quiz" realProgress={progress} words={[]} />
    }

    if (!articleData) return null

    return (
        <QuizView
            readingQuestions={articleData.readingQuestions}
            vocabularyQuestions={articleData.vocabularyQuestions}
            onSubmit={onQuizSubmit}
            isSubmitting={isSubmitting}
            onExit={onExit}
            readOnly={readOnly}
            result={quizResult}
            onBack={onExit} // Mapping exit to back for now
        />
    )
}
