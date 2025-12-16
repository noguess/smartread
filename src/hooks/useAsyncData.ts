import { useState, useCallback, useEffect, useRef } from 'react'

interface AsyncState<T> {
    data: T | null
    loading: boolean
    error: Error | null
}

export function useAsyncData<T, Args extends any[] = []>(
    asyncFn: (...args: Args) => Promise<T>,
    immediate = false,
    immediateArgs?: Args
) {
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        loading: immediate,
        error: null,
    })

    // Use ref to keep track of latest asyncFn without triggering re-renders or infinite loops if dependency array is unstable
    const fnRef = useRef(asyncFn)
    useEffect(() => {
        fnRef.current = asyncFn
    }, [asyncFn])

    const setData = useCallback((data: T | null) => {
        setState(prev => ({ ...prev, data }))
    }, [])

    const execute = useCallback(async (...args: Args) => {
        setState(prev => ({ ...prev, loading: true, error: null }))
        try {
            const response = await fnRef.current(...args)
            setState({ data: response, loading: false, error: null })
            return response
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            setState({ data: null, loading: false, error: err })
            throw err
        }
    }, [])

    useEffect(() => {
        if (immediate) {
            execute(...(immediateArgs || [] as unknown as Args)).catch(() => {
                // Error handled in state
            })
        }
    }, [execute, immediate, immediateArgs]) // Dependencies mostly stable

    return { ...state, execute, setData }
}
