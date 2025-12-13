
import ArticleContent from '../components/reading/ArticleContent'
import GenerationLoading from '../components/reading/GenerationLoading'
import DefinitionPopover from '../components/reading/DefinitionPopover'
import SentenceAnalysisPopover from '../components/reading/SentenceAnalysisPopover'
import { Article, Word } from '../services/db'

interface ArticleViewProps {
    article: Article | null
    fontSize: number
    onSelection: (text: string, position: { top: number; left: number }) => void
    popoverState: { text: string; type: 'word' | 'sentence'; position: { top: number; left: number } } | null
    onClosePopover: () => void
    onDeepDive: (word: string) => void
    isLoading?: boolean
    error?: string | null
    settings: import('../services/db').Setting
}

export default function ArticleView({
    article,
    fontSize,
    onSelection,
    popoverState,
    onClosePopover,
    onDeepDive,
    isLoading,
    error,
    settings
}: ArticleViewProps) {
    if (isLoading) return <GenerationLoading mode="article" realProgress={0} words={[]} />

    if (!article) return null // Or EmptyState

    return (
        <>
            <ArticleContent
                title={article.title}
                content={article.content}
                wordCount={article.content.split(/\s+/).length} // Approximate
                difficultyLevel={article.difficultyLevel}
                fontSize={fontSize}
                onSelection={onSelection}
            />

            {/* Popovers */}
            <DefinitionPopover
                open={Boolean(popoverState && popoverState.type === 'word')}
                anchorPosition={popoverState?.position}
                word={popoverState?.text || ''}
                onClose={onClosePopover}
                onDeepDive={onDeepDive}
            />

            <SentenceAnalysisPopover
                anchorPosition={popoverState?.position || null}
                sentence={popoverState?.text || ''}
                onClose={onClosePopover}
                settings={settings}
                articleId={article.uuid}
            />
        </>
    )
}
