'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { VotingCard } from '@/components/VotingCard'
import { Database } from '@/types/supabase'

type Voting = Database['public']['Tables']['votings']['Row']

// Enable caching for fetch requests in this component
export const fetchCache = 'default-cache'

export function VotingList() {
  const [votings, setVotings] = useState<Voting[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchVotings = async () => {
      try {
        const { data: votings, error: votingsError } = await supabase
          .from('votings')
          .select('*')
          .order('created_at', { ascending: false })

        if (votingsError) throw votingsError

        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('voting_id')

        if (votesError) throw votesError

        const counts: Record<string, number> = {}
        votes?.forEach(vote => {
          counts[vote.voting_id] = (counts[vote.voting_id] || 0) + 1
        })

        setVotings(votings || [])
        setVoteCounts(counts)
      } catch (error) {
        console.error('Error fetching votings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVotings()

    // Subscribe to realtime changes
    const votesSubscription = supabase
      .channel('votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes'
        },
        async () => {
          const { data: votes } = await supabase
            .from('votes')
            .select('voting_id')

          const counts: Record<string, number> = {}
          votes?.forEach(vote => {
            counts[vote.voting_id] = (counts[vote.voting_id] || 0) + 1
          })

          setVoteCounts(counts)
        }
      )
      .subscribe()

    return () => {
      votesSubscription.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[200px] rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (votings.length === 0) {
    return (
      <div className="rounded-lg border border-muted bg-card p-8 text-center text-muted-foreground">
        Belum ada voting yang dibuat.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {votings.map(voting => (
        <VotingCard
          key={voting.id}
          voting={voting}
          totalVotes={voteCounts[voting.id] || 0}
        />
      ))}
    </div>
  )
} 