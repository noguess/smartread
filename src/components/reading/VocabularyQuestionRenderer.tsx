import { useState } from 'react'
import {
    Box,
    Typography,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Select,
    MenuItem,
    IconButton,
    Chip,
    Paper,
} from '@mui/material'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { Question } from '../../services/mockLLMService'
import { ttsService } from '../../services/ttsService'

interface VocabularyQuestionRendererProps {
    question: Question
    answer: string | string[]
    onChange: (value: string | string[]) => void
    index: number
    readOnly?: boolean
    correctAnswer?: string | string[]
    isCorrect?: boolean
}

export default function VocabularyQuestionRenderer({
    question,
    answer,
    onChange,
    index,
    readOnly = false,
    correctAnswer,
    isCorrect,
}: VocabularyQuestionRendererProps) {
    const [isPlaying, setIsPlaying] = useState(false)

    // Handle audio playback
    const handlePlayAudio = () => {
        if (question.targetWord && ttsService.isSupported()) {
            setIsPlaying(true)
            ttsService.playWord(question.targetWord, question.phonetic)
            // Reset playing state after 1 second
            setTimeout(() => setIsPlaying(false), 1000)
        }
    }

    // Render based on question type
    const renderQuestionInput = () => {
        switch (question.type) {
            case 'cloze':
            case 'definition':
            case 'contextual':
            case 'synonym':
                // 选择题类型 - 使用 RadioGroup
                return (
                    <FormControl fullWidth disabled={readOnly}>
                        <RadioGroup
                            value={(answer as string) || ''}
                            onChange={(e) => onChange(e.target.value)}
                        >
                            {(question.options || []).map((opt) => {
                                const isSelected = (answer as string) === opt
                                const isTheCorrectAnswer = (correctAnswer as string) === opt

                                let color = 'text.primary'
                                if (readOnly) {
                                    if (isTheCorrectAnswer) color = 'success.main'
                                    else if (isSelected && !isCorrect) color = 'error.main'
                                }

                                return (
                                    <FormControlLabel
                                        key={opt}
                                        value={opt}
                                        control={<Radio color={readOnly && isTheCorrectAnswer ? 'success' : isSelected && !isCorrect ? 'error' : 'primary'} />}
                                        label={
                                            <Typography color={color} fontWeight={readOnly && isTheCorrectAnswer ? 'bold' : 'normal'}>
                                                {opt} {readOnly && isTheCorrectAnswer && '(Correct)'} {readOnly && isSelected && !isCorrect && '(Your Answer)'}
                                            </Typography>
                                        }
                                        sx={{
                                            mb: 0.5,
                                            '& .MuiFormControlLabel-label': {
                                                fontSize: '1rem',
                                            },
                                        }}
                                    />
                                )
                            })}
                        </RadioGroup>
                    </FormControl>
                )

            case 'spelling':
            case 'wordForm':
                // 输入题类型 - 使用 TextField
                return (
                    <Box>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Type your answer here..."
                            value={(answer as string) || ''}
                            onChange={(e) => onChange(e.target.value)}
                            disabled={readOnly}
                            error={readOnly && !isCorrect}
                            sx={{
                                mt: 2,
                                '& .MuiOutlinedInput-root': {
                                    fontSize: '1.1rem',
                                    borderRadius: 2,
                                },
                            }}
                        />
                        {readOnly && !isCorrect && (
                            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                Correct Answer: {correctAnswer as string}
                            </Typography>
                        )}
                    </Box>
                )

            case 'audio':
                // 音频题型 - 音频播放器 + 选择或输入
                const hasOptions = question.options && question.options.length > 0
                return (
                    <Box>
                        {/* 音频播放按钮 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <IconButton
                                onClick={handlePlayAudio}
                                color="primary"
                                sx={{
                                    bgcolor: isPlaying ? 'primary.light' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: 'primary.light',
                                    },
                                }}
                            >
                                <VolumeUpIcon />
                            </IconButton>
                            <Typography variant="body2" color="text.secondary">
                                {isPlaying ? 'Playing...' : 'Click to play audio'}
                            </Typography>
                            {question.phonetic && (
                                <Chip
                                    label={question.phonetic}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Box>

                        {/* 答题区域 */}
                        {hasOptions ? (
                            // 听音选择
                            <FormControl fullWidth disabled={readOnly}>
                                <RadioGroup
                                    value={(answer as string) || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                >
                                    {question.options!.map((opt) => {
                                        const isSelected = (answer as string) === opt
                                        const isTheCorrectAnswer = (correctAnswer as string) === opt

                                        let color = 'text.primary'
                                        if (readOnly) {
                                            if (isTheCorrectAnswer) color = 'success.main'
                                            else if (isSelected && !isCorrect) color = 'error.main'
                                        }

                                        return (
                                            <FormControlLabel
                                                key={opt}
                                                value={opt}
                                                control={<Radio color={readOnly && isTheCorrectAnswer ? 'success' : isSelected && !isCorrect ? 'error' : 'primary'} />}
                                                label={
                                                    <Typography color={color} fontWeight={readOnly && isTheCorrectAnswer ? 'bold' : 'normal'}>
                                                        {opt} {readOnly && isTheCorrectAnswer && '(Correct)'} {readOnly && isSelected && !isCorrect && '(Your Answer)'}
                                                    </Typography>
                                                }
                                            />
                                        )
                                    })}
                                </RadioGroup>
                            </FormControl>
                        ) : (
                            // 听音输入
                            <Box>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Type what you hear..."
                                    value={(answer as string) || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    disabled={readOnly}
                                    error={readOnly && !isCorrect}
                                />
                                {readOnly && !isCorrect && (
                                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                        Correct Answer: {correctAnswer as string}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                )

            case 'matching':
                // 匹配题型 - 使用下拉选择
                const pairs = question.pairs || []
                const currentAnswers = (answer as string[]) || Array(pairs.length).fill('')

                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Match each word with its definition:
                        </Typography>
                        {pairs.map((pair, idx) => {
                            const userAnswer = currentAnswers[idx]
                            const correctPairAnswer = Array.isArray(correctAnswer) ? correctAnswer[idx] : ''
                            const isPairCorrect = userAnswer === correctPairAnswer

                            return (
                                <Paper
                                    key={idx}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        mb: 1.5,
                                        bgcolor: readOnly
                                            ? (isPairCorrect ? 'success.light' : 'error.light')
                                            : 'action.hover',
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        fontWeight="bold"
                                        sx={{ minWidth: 120 }}
                                    >
                                        {pair.word}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mx: 2 }}>
                                        →
                                    </Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <Select
                                            fullWidth
                                            value={userAnswer || ''}
                                            onChange={(e) => {
                                                const newAnswers = [...currentAnswers]
                                                newAnswers[idx] = e.target.value
                                                onChange(newAnswers)
                                            }}
                                            displayEmpty
                                            disabled={readOnly}
                                        >
                                            <MenuItem value="" disabled>
                                                <em>Select definition...</em>
                                            </MenuItem>
                                            {pairs.map((p, defIdx) => (
                                                <MenuItem key={defIdx} value={`${pair.word}-def${defIdx}`}>
                                                    {p.definition}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {readOnly && !isPairCorrect && (
                                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                                Correct: {pairs.find(p => `${pair.word}-def${pairs.indexOf(p)}` === correctPairAnswer)?.definition || 'Unknown'}
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>
                            )
                        })}
                    </Box>
                )

            default:
                return (
                    <Typography color="error">
                        Unknown question type: {question.type}
                    </Typography>
                )
        }
    }

    return (
        <Box sx={{ mb: 4 }}>
            {/* 题目标题 */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                    {index + 1}. {question.stem}
                </Typography>
                {/* 题型标签 */}
                <Chip
                    label={question.type}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 'auto', textTransform: 'capitalize' }}
                />
            </Box>

            {/* 目标单词显示 */}
            {question.targetWord && (
                <Typography
                    variant="caption"
                    color="primary"
                    sx={{ display: 'block', mb: 1 }}
                >
                    Target: <strong>{question.targetWord}</strong>
                </Typography>
            )}

            {/* 渲染具体的输入组件 */}
            {renderQuestionInput()}
        </Box>
    )
}
