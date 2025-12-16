import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useAsyncData } from './useAsyncData'

describe('useAsyncData', () => {
    it('should initialize with default state', () => {
        // Pass a dummy function, and immediate=false
        const { result } = renderHook(() => useAsyncData(async () => 'test', false))

        expect(result.current.data).toBeNull()
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it('should execute async function and update state on success', async () => {
        const mockData = { id: 1, name: 'Test' }
        const mockFn = vi.fn().mockResolvedValue(mockData)

        const { result } = renderHook(() => useAsyncData(mockFn, false))

        // Initial state
        expect(result.current.loading).toBe(false)

        // Execute
        let promise: Promise<any>
        act(() => {
            promise = result.current.execute()
        })

        // Should be loading immediately after execute called (inside act or right after?)
        // React batching might mean we see it in next render.
        expect(result.current.loading).toBe(true)

        await act(async () => {
            await promise
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.data).toEqual(mockData)
        expect(result.current.error).toBeNull()
    })

    it('should support arguments in execute', async () => {
        const mockFn = vi.fn().mockImplementation(async (id: number) => ({ id }))
        const { result } = renderHook(() => useAsyncData(mockFn, false))

        await act(async () => {
            const res = await result.current.execute(123)
            expect(res).toEqual({ id: 123 })
        })
        expect(result.current.data).toEqual({ id: 123 })
    })

    it('should handle errors correctly', async () => {
        const mockError = new Error('Network Error')
        const mockFn = vi.fn().mockRejectedValue(mockError)

        const { result } = renderHook(() => useAsyncData(mockFn, false))

        await act(async () => {
            try {
                await result.current.execute()
            } catch (e) {
                // Hook might re-throw or just set error state. 
                // Let's assume it catches internally to set state, but maybe returns it?
            }
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBeNull()
        expect(result.current.error).toEqual(mockError)
    })

    it('should support immediate execution', async () => {
        const mockFn = vi.fn().mockResolvedValue('immediate')
        const { result } = renderHook(() => useAsyncData(mockFn, true))

        // Should be loading or already done?
        // With useEffect, it starts on mount.

        await waitFor(() => {
            expect(result.current.data).toBe('immediate')
        })
    })
})
