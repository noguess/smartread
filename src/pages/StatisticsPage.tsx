import { useState, useEffect } from 'react'
import { Box, Typography, Grid, Paper } from '@mui/material'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
import { historyService } from '../services/historyService'
import { wordService } from '../services/wordService'

export default function StatisticsPage() {
    const [trendData, setTrendData] = useState<any[]>([])
    const [scoreData, setScoreData] = useState<any[]>([])
    const [statusData, setStatusData] = useState<any[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        // 1. Load History for Trend & Scores
        const history = await historyService.getHistory()

        // Process Trend (Last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })

        const trend = last7Days.map(date => {
            // Mocking trend data based on history dates would be complex without real dates
            // For now, let's aggregate real history if available, or show 0
            const count = history.filter(h => new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date).length
            return { date, articles: count }
        })
        setTrendData(trend)

        // Process Scores
        const scores = history.map(h => ({
            name: new Date(h.date).toLocaleDateString(),
            score: h.userScore
        })).slice(-10) // Last 10 records
        setScoreData(scores)

        // 2. Load Words for Status Pie Chart
        const words = await wordService.getAllWords()
        const statusCounts = {
            New: 0,
            Learning: 0,
            Review: 0,
            Mastered: 0
        }
        words.forEach(w => {
            if (statusCounts[w.status as keyof typeof statusCounts] !== undefined) {
                statusCounts[w.status as keyof typeof statusCounts]++
            }
        })

        const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
        setStatusData(pieData)
    }

    const COLORS = ['#0088FE', '#FFBB28', '#FF8042', '#00C49F']

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                学习统计
            </Typography>

            <Grid container spacing={3}>
                {/* Learning Trend */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: 300 }}>
                        <Typography variant="h6" gutterBottom>
                            近7天阅读量
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="articles" stroke="#8884d8" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Word Status Distribution */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: 300 }}>
                        <Typography variant="h6" gutterBottom>
                            单词掌握情况
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                            {statusData.map((entry, index) => (
                                <Typography key={entry.name} variant="caption" sx={{ color: COLORS[index % COLORS.length] }}>
                                    {entry.name}: {entry.value}
                                </Typography>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Recent Scores */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, height: 300 }}>
                        <Typography variant="h6" gutterBottom>
                            近期考试成绩
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="score" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    )
}
