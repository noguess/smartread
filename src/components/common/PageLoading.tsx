import { Box, CircularProgress, Typography } from '@mui/material'

interface PageLoadingProps {
    message?: string
}

export default function PageLoading({ message }: PageLoadingProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px', // or 100vh depending on context, use minHeight to be safe
                height: '100%',
                flex: 1
            }}
        >
            <CircularProgress />
            {message && (
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    )
}
