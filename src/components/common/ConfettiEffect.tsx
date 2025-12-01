import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiEffectProps {
    trigger: boolean
    duration?: number
}

export default function ConfettiEffect({ trigger, duration = 3000 }: ConfettiEffectProps) {
    useEffect(() => {
        if (!trigger) return

        const end = Date.now() + duration

        const colors = ['#4A90E2', '#7B68EE', '#00D9A5', '#FFD93D', '#FF6B6B']

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            })
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            })

            if (Date.now() < end) {
                requestAnimationFrame(frame)
            }
        }

        frame()
    }, [trigger, duration])

    return null
}
