import type { GroupData } from './types'

export const GROUP_DATA: GroupData = {
  name: 'College Barkada Fund',
  contributionAmount: 10,
  // totalMembers is now dynamic — derived from on-chain data
  totalMembers: 0,
  currentCycle: 1,
  poolAddress: process.env.NEXT_PUBLIC_POOL_ADDRESS ?? '',
  // targetPoolAmount is also dynamic — contributionAmount × unique senders
  targetPoolAmount: 0,
}

// No MEMBERS array — members are derived dynamically from pool transactions
// No SCHEDULE array — schedule is derived dynamically from contributors
