import { Box, Button, Container } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/common'

export default function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh'
                }}
            >
                <EmptyState
                    icon="🪐"
                    title="404 - Page Not Found"
                    description="The page you are looking for does not exist or has been moved."
                    action={
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/')}
                        >
                            Back to Home
                        </Button>
                    }
                />
            </Box>
        </Container>
    )
}
