'use client'

import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SuccessConfettiProps {
  show: boolean
  onDismiss: () => void
}

interface Particle {
  id: number
  xEnd: number
  yEnd: number
  rotate: number
  delay: number
  size: number
  color: string
  rounded: boolean
}

const COLORS = ['#10b981', '#f59e0b', '#1e3a5f']
const PARTICLE_COUNT = 40

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function SuccessConfetti({ show, onDismiss }: SuccessConfettiProps) {
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => onDismiss(), 3000)
    return () => clearTimeout(timer)
  }, [show, onDismiss])

  // Generate stable particle values per mount — useMemo with empty deps so they
  // don't re-randomise on every render.
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      xEnd: randomBetween(-200, 200),
      yEnd: randomBetween(-300, 100),
      rotate: randomBetween(-360, 360),
      delay: randomBetween(0, 0.5),
      size: Math.floor(randomBetween(6, 14)),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rounded: Math.random() > 0.5,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="confetti-overlay"
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.rounded ? '50%' : '2px',
              }}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
                x: p.xEnd,
                y: p.yEnd,
                rotate: p.rotate,
              }}
              transition={{
                duration: 1,
                delay: p.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
