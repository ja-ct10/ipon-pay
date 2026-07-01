'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { calculateProgress, cn } from '@/lib/utils'

interface PoolProgressProps {
  collected: number
  target: number
  className?: string
}

export function PoolProgress({ collected, target, className }: PoolProgressProps) {
  const pct = calculateProgress(collected, target)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('w-full', className)}
    >
      <Card className="rounded-2xl border-white/7 bg-card">
        <CardHeader>
          <CardTitle>Pool Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={pct} />
          <p className="text-sm text-muted-foreground">
            {collected.toFixed(2)} / {target.toFixed(2)} XLM collected
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
