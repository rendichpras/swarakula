'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Vote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VotingCard } from '@/components/VotingCard'
import { VotingCardSkeleton } from '@/components/VotingCardSkeleton'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Voting = Database['public']['Tables']['votings']['Row']

interface VotingListProps {
  userId?: string
}

export function VotingList({ userId }: VotingListProps) {
  const [votings, setVotings] = useState<Voting[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchVotings = async () => {
      try {
        let query = supabase
          .from('votings')
          .select('*')
          .order('created_at', { ascending: false })

        if (userId) {
          query = query.eq('creator_id', userId)
        }

        const { data, error } = await query

        if (error) throw error
        setVotings(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVotings()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('voting_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'votings',
        filter: userId ? `creator_id=eq.${userId}` : undefined
      }, (payload) => {
        setVotings(current => [payload.new as Voting, ...current])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const handleVotingUpdate = (updatedVoting: Voting) => {
    setVotings(current =>
      current.map(voting =>
        voting.id === updatedVoting.id ? updatedVoting : voting
      )
    )
  }

  const handleVotingDelete = (votingId: string) => {
    setVotings(current => current.filter(voting => voting.id !== votingId))
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <VotingCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (votings.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
        <Vote className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium">Belum ada voting</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {userId ? 'Anda belum membuat voting apapun.' : 'Belum ada voting yang tersedia.'}
        </p>
        <Button asChild>
          <Link href="/create">Buat Voting</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {votings.map((voting) => (
        <VotingCard
          key={voting.id}
          voting={voting}
          onVotingUpdate={handleVotingUpdate}
          onVotingDelete={handleVotingDelete}
        />
      ))}
    </div>
  )
} 