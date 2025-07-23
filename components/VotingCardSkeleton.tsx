import { Skeleton } from '@/components/ui/skeleton'

export function VotingCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="space-y-3 p-6">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  )
} 