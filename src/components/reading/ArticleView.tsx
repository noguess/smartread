import { Paper, Typography, Box } from '@mui/material'
import ReactMarkdown from 'react-markdown'

interface ArticleViewProps {
    title: string
    content: string
    onWordClick?: (word: string) => void
}

export default function ArticleView({ title, content, onWordClick }: ArticleViewProps) {
    const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>) => {
        const word = e.currentTarget.textContent || ''
        if (onWordClick) {
            onWordClick(word)
        }
    }

    return (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, minHeight: '60vh' }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" align="center">
                {title}
            </Typography>

            <Box sx={{ mt: 4, typography: 'body1', lineHeight: 1.8, fontSize: '1.1rem' }}>
                <ReactMarkdown
                    components={{
                        strong: ({ node: _node, ...props }) => (
                            <span
                                style={{
                                    color: '#0097A7',
                                    fontWeight: 'bold',
                                    backgroundColor: '#E0F7FA',
                                    padding: '0 4px',
                                    borderRadius: '4px',
                                    cursor: onWordClick ? 'pointer' : 'default',
                                }}
                                onClick={onWordClick ? handleWordClick : undefined}
                                {...props}
                            />
                        ),
                    }}
                >
                    {content}
                </ReactMarkdown>
            </Box>
        </Paper>
    )
}
