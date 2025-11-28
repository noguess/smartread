import { Paper, Typography, Box, Grid, LinearProgress } from '@mui/material'
import { WordStatus } from '../../services/db'

interface DashboardStatsProps {
    totalWords: number
    masteredCount: number
    statusCounts: Record<WordStatus, number>
}

export default function DashboardStats({
    totalWords,
    masteredCount,
    statusCounts,
}: DashboardStatsProps) {
    const getPercent = (count: number) => (totalWords > 0 ? (count / totalWords) * 100 : 0)

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
                Memory Status
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Mastery Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={getPercent(masteredCount)}
                            sx={{ height: 10, borderRadius: 5, bgcolor: '#E0E0E0' }}
                            color="success"
                        />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                        {masteredCount}
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Typography variant="caption" color="error.main" fontWeight="bold">
                        Review (Expired)
                    </Typography>
                    <Typography variant="h6">{statusCounts.Review}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="primary.main" fontWeight="bold">
                        New Words
                    </Typography>
                    <Typography variant="h6">{statusCounts.New}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="warning.main" fontWeight="bold">
                        Learning
                    </Typography>
                    <Typography variant="h6">{statusCounts.Learning}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        Total
                    </Typography>
                    <Typography variant="h6">{totalWords}</Typography>
                </Grid>
            </Grid>
        </Paper>
    )
}
