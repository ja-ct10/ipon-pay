'use client'

import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { cn } from '@/lib/utils'
import type { GroupData } from '@/lib/types'

interface StatCardProps {
  label: string
  value: string | number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-card border border-white/7 p-5 flex flex-col gap-1.5 transition-all duration-200 hover:border-emerald-500/15 hover:shadow-md hover:shadow-emerald-500/5">
      <span className="text-xs text-muted-foreground tracking-wider uppercase font-medium">{label}</span>
      <span className="text-2xl font-bold tracking-tight truncate">{value}</span>
    </div>
  )
}

interface GroupStatsProps {
  data: GroupData
  nextRecipientName: string
  isLoading: boolean
  className?: string
}

const SKELETON_COUNT = 5

export function GroupStats({ data, nextRecipientName, isLoading, className }: GroupStatsProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {isLoading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        : (
          <>
            <StatCard label="Group" value={data.name} />
            <StatCard label="Members" value={data.totalMembers} />
            <StatCard label="Contribution" value={`${data.contributionAmount} XLM`} />
            <StatCard label="Current Cycle" value={data.currentCycle} />
            <StatCard label="Next Recipient" value={nextRecipientName} />
          </>
        )}
    </div>
  )
}
