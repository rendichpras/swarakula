'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/supabase'

type Voting = Database['public']['Tables']['votings']['Row']

interface VotingCardProps {
  voting: Voting
  totalVotes: number
}

export function VotingCard({ voting, totalVotes }: VotingCardProps) {
  const isEnded = new Date(voting.end_at) < new Date()
  const timeLeft = formatDistanceToNow(new Date(voting.end_at), {
    addSuffix: true,
    locale: idLocale
  })

  return (
    <Link href={`/vote/${voting.id}`} className="block h-full">
      <Card className="h-full transition-all hover:scale-[1.02] hover:shadow-lg">
        <CardHeader>
          <CardTitle className="line-clamp-2 text-lg sm:text-xl">{voting.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground sm:text-base">
            {voting.description}
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={isEnded ? 'secondary' : 'default'} className="whitespace-nowrap">
              {isEnded ? 'Berakhir' : timeLeft}
            </Badge>
            {voting.multiple_choice && (
              <Badge variant="outline" className="whitespace-nowrap">
                Pilihan Ganda
              </Badge>
            )}
          </div>
          <span className="ml-auto text-sm text-muted-foreground sm:text-base">
            {totalVotes} suara
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
} 