
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RecentActivityList, { DashboardActivity } from './RecentActivityList'

// Mock translations
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'home:recentActivity.noActivity') return 'No recent activity'
            return key
        },
        i18n: { language: 'en' }
    })
}))

describe('RecentActivityList', () => {
    const mockActivities: DashboardActivity[] = [
        {
            id: 1,
            type: 'article',
            title: 'Test Article',
            date: 1672531200000, // 2023-01-01
            difficultyLevel: 'L2'
        },
        {
            id: 101,
            type: 'quiz',
            title: 'Test Quiz',
            date: 1672617600000, // 2023-01-02
            score: 95,
            articleId: 2
        }
    ]

    it('renders empty state when no activities provided', () => {
        render(<RecentActivityList activities={[]} />)
        expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })

    it('renders activities correctly', () => {
        render(<RecentActivityList activities={mockActivities} />)

        expect(screen.getByText('Test Article')).toBeInTheDocument()
        expect(screen.getByText('Test Quiz')).toBeInTheDocument()
        expect(screen.getByText('L2')).toBeInTheDocument()
        expect(screen.getByText(/95/)).toBeInTheDocument()
    })

    it('calls onItemClick when an item is clicked', () => {
        const handleClick = vi.fn()
        render(<RecentActivityList activities={mockActivities} onItemClick={handleClick} />)

        const articleItem = screen.getByText('Test Article')
        fireEvent.click(articleItem)

        expect(handleClick).toHaveBeenCalledTimes(1)
        expect(handleClick).toHaveBeenCalledWith(mockActivities[0])

        const quizItem = screen.getByText('Test Quiz')
        fireEvent.click(quizItem)

        expect(handleClick).toHaveBeenCalledTimes(2)
        expect(handleClick).toHaveBeenCalledWith(mockActivities[1])
    })
})
