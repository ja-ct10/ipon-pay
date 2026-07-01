'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTimestamp, cn } from '@/lib/utils'
import type { Member } from '@/lib/types'

interface MemberListProps {
  members: Member[]
  connectedAddress?: string | null   // highlight "you"
  className?: string
}

export function MemberList({ members, connectedAddress, className }: MemberListProps) {
  return (
    <Card className={cn('rounded-2xl border-white/7 bg-card', className)}>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No contributions yet — be the first to join the pool!
          </p>
        )}
        <ul className="space-y-3">
          {members.map((member) => {
            const isYou = connectedAddress && member.address === connectedAddress
            return (
              <li
                key={member.id}
                className={cn(
                  'flex items-center justify-between gap-4 rounded-xl px-3 py-2 -mx-3',
                  isYou && 'bg-emerald-500/10 border border-emerald-500/20',
                )}
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono truncate">{member.name}</span>
                    {isYou && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-1.5 py-0">
                        You
                      </Badge>
                    )}
                  </div>
                  {member.hasPaid && member.paidAt ? (
                    <span className="text-xs text-muted-foreground">
                      Paid · {formatTimestamp(member.paidAt)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending payment</span>
                  )}
                </div>
                {member.hasPaid ? (
                  <Badge
                    aria-label={`${member.name}: paid`}
                    className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs shrink-0"
                  >
                    Paid
                  </Badge>
                ) : (
                  <Badge
                    aria-label={`${member.name}: payment pending`}
                    className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs shrink-0"
                  >
                    Pending
                  </Badge>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
