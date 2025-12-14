import { useState, useEffect } from 'react'
import {
    Box, Typography, Grid, Paper, Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip
} from '@mui/material'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import { statsService, OverviewStats, DailyTrend } from '../services/statsService'
import { useTranslation } from 'react-i18next'
import { WordStatus } from '../services/db'

export default function StatisticsPage() {
    const { t } = useTranslation(['statistics'])
    const [tabValue, setTabValue] = useState(0)
    const [overview, setOverview] = useState<OverviewStats | null>(null)
    const [trends, setTrends] = useState<DailyTrend[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const o = await statsService.getOverviewStats()
        const t = await statsService.getTrendStats(14)
        setOverview(o)
        setTrends(t)
    }

    const STATUS_COLORS: Record<WordStatus, string> = {
        'New': '#9e9e9e',
        'Learning': '#2196f3',
        'Review': '#ff9800',
        'Mastered': '#4caf50'
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <Paper sx={{ p: 1.5, border: '1px solid #ccc' }}>
                    <Typography variant="subtitle2">{label}</Typography>
                    {payload.map((p: any) => (
                        <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
                            <Typography variant="body2" color="text.secondary">
                                {p.name}: {p.value}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            )
        }
        return null
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    {t('statistics:title')}
                </Typography>
            </Box>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label={t('statistics:tabs.overview')} />
                <Tab label={t('statistics:tabs.trends')} />
            </Tabs>

            {/* TAB 1: OVERVIEW */}
            {tabValue === 0 && overview && (
                <Grid container spacing={3}>
                    {/* Row 1: Word Status & Activity */}
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 3, height: 320 }}>
                            <Typography variant="h6" gutterBottom>{t('statistics:overview.words_title')}</Typography>
                            <ResponsiveContainer width="100%" height="85%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(overview.wordStats).map(([k, v]) => ({
                                            name: t(`statistics:status.${k}` as any),
                                            value: v,
                                            key: k
                                        }))}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {Object.entries(overview.wordStats).map(([k]) => (
                                            <Cell key={k} fill={STATUS_COLORS[k as WordStatus] || '#8884d8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3, height: 320, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6">{t('statistics:overview.activity_title')}</Typography>
                            <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                                <Box>
                                    <Typography variant="h3" color="primary">{overview.activityStats.totalArticles}</Typography>
                                    <Typography variant="subtitle1" color="text.secondary">{t('statistics:overview.total_articles')}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h3" color="secondary">{overview.activityStats.totalQuizzes}</Typography>
                                    <Typography variant="subtitle1" color="text.secondary">{t('statistics:overview.total_quizzes')}</Typography>
                                </Box>
                            </Box>

                            {/* Difficulty Bars */}
                            <Box sx={{ mt: 'auto' }}>
                                <Typography variant="subtitle2" gutterBottom>{t('statistics:overview.difficulty_title')}</Typography>
                                <ResponsiveContainer width="100%" height={120}>
                                    <BarChart
                                        data={[
                                            { name: t('statistics:trends.article_count'), L1: overview.difficultyStats.articles['L1'], L2: overview.difficultyStats.articles['L2'], L3: overview.difficultyStats.articles['L3'] },
                                            { name: t('statistics:trends.quiz_count'), L1: overview.difficultyStats.quizzes['L1'], L2: overview.difficultyStats.quizzes['L2'], L3: overview.difficultyStats.quizzes['L3'] }
                                        ]}
                                        layout="vertical"
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="L1" stackId="a" fill="#82ca9d" />
                                        <Bar dataKey="L2" stackId="a" fill="#8884d8" />
                                        <Bar dataKey="L3" stackId="a" fill="#ffc658" />
                                        <Legend />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Row 2: Score Distribution (NEW) */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 350 }}>
                            <Typography variant="h6" gutterBottom>{t('statistics:overview.score_distribution_title')}</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart
                                    data={[
                                        // Flatten map to array for Recharts
                                        ...['L1', 'L2', 'L3'].map(level => ({
                                            name: level,
                                            '0-59': overview.scoreDistribution[level]['0-59'],
                                            '60-79': overview.scoreDistribution[level]['60-79'],
                                            '80-100': overview.scoreDistribution[level]['80-100']
                                        }))
                                    ]}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="0-59" stackId="a" fill="#ef5350" name="0-59" />
                                    <Bar dataKey="60-79" stackId="a" fill="#ff9800" name="60-79" />
                                    <Bar dataKey="80-100" stackId="a" fill="#4caf50" name="80-100" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>


                    {/* Row 2: Efficiency Table */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 350, overflow: 'auto' }}>
                            <Typography variant="h6" gutterBottom>{t('statistics:overview.efficiency_title')}</Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>{t('statistics:overview.efficiency_table.level')}</TableCell>
                                            <TableCell align="right">{t('statistics:overview.efficiency_table.reading_speed')}</TableCell>
                                            <TableCell align="right">{t('statistics:overview.efficiency_table.quiz_time')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {['L1', 'L2', 'L3'].map((level) => (
                                            <TableRow key={level}>
                                                <TableCell>
                                                    <Chip label={level} size="small" color={level === 'L1' ? 'success' : level === 'L2' ? 'primary' : 'warning'} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {overview.efficiencyStats.avgReadingSpeed[level] || '-'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {overview.efficiencyStats.avgQuizTimePerQuestion[level] || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* TAB 2: TRENDS */}
            {tabValue === 1 && (
                <Grid container spacing={3}>
                    {/* Activity Trend */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, height: 350 }}>
                            <Typography variant="h6" gutterBottom>{t('statistics:trends.activity_title')}</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="articles_Total" name={t('statistics:trends.article_count')} fill="#8884d8" />
                                    <Bar dataKey="quizzes_Total" name={t('statistics:trends.quiz_count')} fill="#82ca9d" />
                                    {/* Now using distinct data keys to ensure side-by-side rendering */}
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Score Trend (Was Reading Speed) */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 300 }}>
                            <Typography variant="h6" gutterBottom>{t('statistics:trends.score_title')}</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="score_L1" stroke="#82ca9d" name={t('statistics:trends.series.l1_score')} connectNulls />
                                    <Line type="monotone" dataKey="score_L2" stroke="#8884d8" name={t('statistics:trends.series.l2_score')} connectNulls />
                                    <Line type="monotone" dataKey="score_L3" stroke="#ffc658" name={t('statistics:trends.series.l3_score')} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Study Time Trend (Stacked Area - Total Time) */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 300 }}>
                            <Typography variant="h6" gutterBottom>{t('statistics:trends.time_title')}</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <AreaChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="time_L1" stackId="1" stroke="#82ca9d" fill="#82ca9d" name={t('statistics:trends.series.l1_min')} />
                                    <Area type="monotone" dataKey="time_L2" stackId="1" stroke="#8884d8" fill="#8884d8" name={t('statistics:trends.series.l2_min')} />
                                    <Area type="monotone" dataKey="time_L3" stackId="1" stroke="#ffc658" fill="#ffc658" name={t('statistics:trends.series.l3_min')} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* NEW: Avg Reading Time Trend (Line Chart) */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 300 }}>
                            <Typography variant="h6" gutterBottom>{t('statistics:trends.reading_time_title')}</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis label={{ value: t('statistics:trends.axis.sec'), angle: -90, position: 'insideLeft' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="avgReadTime_L1" stroke="#82ca9d" name={t('statistics:trends.series.l1_sec')} connectNulls />
                                    <Line type="monotone" dataKey="avgReadTime_L2" stroke="#8884d8" name={t('statistics:trends.series.l2_sec')} connectNulls />
                                    <Line type="monotone" dataKey="avgReadTime_L3" stroke="#ffc658" name={t('statistics:trends.series.l3_sec')} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* NEW: Avg Quiz Time Trend (Line Chart) */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 300 }}>
                            <Typography variant="h6" gutterBottom>{t('statistics:trends.quiz_time_title')}</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis label={{ value: t('statistics:trends.axis.sec'), angle: -90, position: 'insideLeft' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="avgQuizTime_L1" stroke="#82ca9d" name={t('statistics:trends.series.l1_sec')} connectNulls />
                                    <Line type="monotone" dataKey="avgQuizTime_L2" stroke="#8884d8" name={t('statistics:trends.series.l2_sec')} connectNulls />
                                    <Line type="monotone" dataKey="avgQuizTime_L3" stroke="#ffc658" name={t('statistics:trends.series.l3_sec')} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    )
}
