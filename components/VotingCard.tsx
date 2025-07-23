'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Voting = Database['public']['Tables']['votings']['Row']

interface VotingCardProps {
  voting: Voting
}

export function VotingCard({ voting }: VotingCardProps) {
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const { count, error } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('voting_id', voting.id)

        if (error) throw error
        setTotalVotes(count || 0)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVotes()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`votes_${voting.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `voting_id=eq.${voting.id}`
      }, async () => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('voting_id', voting.id)
        
        setTotalVotes(count || 0)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [voting.id, supabase])

  const timeLeft = formatDistanceToNow(new Date(voting.end_at), {
    addSuffix: true,
    locale: idLocale
  })

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
      <div className="space-y-1.5 p-6">
        <h3 className="line-clamp-1 text-lg font-semibold leading-none tracking-tight">
          {voting.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {voting.description}
        </p>
        <div className="flex items-center gap-2 pt-1.5">
          <span className="text-xs text-muted-foreground">
            Berakhir {timeLeft}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          {loading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <span className="text-xs text-muted-foreground">
              {totalVotes} suara
            </span>
          )}
        </div>
      </div>
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {voting.multiple_choice ? 'Pilihan Ganda' : 'Pilihan Tunggal'}
          </span>
          <Button asChild>
            <Link href={`/vote/${voting.id}`}>
              Lihat & Vote
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 