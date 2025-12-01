/**
 * V2.0 状态徽章组件
 * 带图标的状态标签，用于显示单词学习状态
 */

import { Chip, ChipProps } from '@mui/material'
import { styled } from '@mui/material/styles'
import {
    FiberNew as NewIcon,
    School as LearningIcon,
    Refresh as ReviewIcon,
    CheckCircle as MasteredIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { WordStatus } from '../../services/db'

interface StatusBadgeProps extends Omit<ChipProps, 'label'> {
    status: WordStatus
    showIcon?: boolean
}

// 状态配置映射（不包含 label，label 从 i18n 获取）
const statusConfig: Record<WordStatus, { icon: any; color: string; gradient: string }> = {
    New: {
        icon: NewIcon,
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
    },
    Learning: {
        icon: LearningIcon,
        color: '#F59E0B',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    },
    Review: {
        icon: ReviewIcon,
        color: '#EF4444',
        gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
    },
    Mastered: {
        icon: MasteredIcon,
        color: '#10B981',
        gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    },
}

// 状态到翻译 key 的映射
const statusToI18nKey: Record<WordStatus, string> = {
    New: 'common:status.new',
    Learning: 'common:status.learning',
    Review: 'common:status.review',
    Mastered: 'common:status.mastered',
}

const StyledChip = styled(Chip)<{ statusgradient: string }>(
    ({ statusgradient }) => ({
        borderRadius: 8,
        fontWeight: 500,
        fontSize: '0.75rem',
        background: statusgradient,
        color: '#fff',
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '& .MuiChip-icon': {
            color: '#fff',
            fontSize: '1rem',
        },
    })
)

export default function StatusBadge({ status, showIcon = true, size = 'small', ...props }: StatusBadgeProps) {
    const { t } = useTranslation(['common'])
    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <StyledChip
            label={t(statusToI18nKey[status])}
            icon={showIcon ? <Icon /> : undefined}
            size={size}
            statusgradient={config.gradient}
            {...props}
        />
    )
}
