'use client'

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
    <div className={cn('w-full', className)}>
      <Card className="rounded-2xl border-white/7 bg-card transition-all duration-200 hover:border-emerald-500/15">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pool Progress</span>
            <span className="text-sm font-medium text-emerald-400">{pct.toFixed(0)}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={pct} />
          <p className="text-sm text-muted-foreground">
            {collected.toFixed(2)} / {target.toFixed(2)} XLM collected
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
