import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PageLoading from './PageLoading'

describe('PageLoading', () => {
    it('renders circular progress', () => {
        render(<PageLoading />)
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('renders custom message if provided', () => {
        render(<PageLoading message="Custom Loading..." />)
        expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
    })
})
