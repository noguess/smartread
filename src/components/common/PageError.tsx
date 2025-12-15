import { Box, Button } from '@mui/material'
import EmptyState from './EmptyState'
import { FallbackProps } from 'react-error-boundary'

// Can be used as FallbackComponent or standalone
interface PageErrorProps {
    error: Error
    resetErrorBoundary?: () => void
    title?: string
}

export default function PageError({ error, resetErrorBoundary, title = "Oops! Something went wrong" }: PageErrorProps & Partial<FallbackProps>) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                height: '100%',
                p: 2
            }}
        >
            <EmptyState
                icon="❌"
                title={title}
                description={error.message || 'Unknown error occurred'}
                action={
                    resetErrorBoundary ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={resetErrorBoundary}
                        >
                            Retry
                        </Button>
                    ) : undefined
                }
            />
        </Box>
    )
}
