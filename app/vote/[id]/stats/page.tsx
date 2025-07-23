'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ResultChart } from '@/components/ResultChart'
import { createClient } from '@/lib/supabase'
import { getVoterUUID } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { ArrowLeft, Lock } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

type Voting = Database['public']['Tables']['votings']['Row']
type Option = Database['public']['Tables']['options']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

interface StatsPageProps {
  params: Promise<{ id: string }>
}

export default function StatsPage({ params }: StatsPageProps) {
  const [voting, setVoting] = useState<Voting | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [hasVoted, setHasVoted] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()
  const { user } = useUser()
  const { id } = use(params)
  const supabase = createClient()

  const checkAccess = (voting: Voting, hasVoted: boolean) => {
    if (user?.id === voting.creator_id) return true
    const isEnded = new Date(voting.end_at) < new Date()
    return (voting.reveal_mode === 'after_vote' && hasVoted) ||
           (voting.reveal_mode === 'after_end' && isEnded)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: voting, error: votingError } = await supabase
          .from('votings')
          .select('*')
          .eq('id', id)
          .single()

        if (votingError) throw votingError

        setVoting(voting)

        const voterUUID = getVoterUUID()
        const { data: userVotes } = await supabase
          .from('votes')
          .select('*')
          .eq('voting_id', id)
          .eq('voter_uuid', voterUUID)

        const userHasVoted = Boolean(userVotes && userVotes.length > 0)
        const canAccess = checkAccess(voting, userHasVoted)

        if (!canAccess) {
          setLoading(false)
          return
        }

        const { data: options, error: optionsError } = await supabase
          .from('options')
          .select('*')
          .eq('voting_id', id)

        if (optionsError) throw optionsError

        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .eq('voting_id', id)

        if (votesError) throw votesError

        setOptions(options)
        setVotes(votes)
        setHasVoted(userHasVoted)
        setHasAccess(true)
      } catch (error) {
        console.error('Error:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    if (hasAccess) {
      const channel = supabase
        .channel(`votes_${id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `voting_id=eq.${id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setVotes(current => [...current, payload.new as Vote])
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [id, router, supabase, user?.id, hasAccess])

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-[300px] animate-pulse rounded-lg border bg-muted" />
        </div>
      </div>
    )
  }

  if (!voting) return null

  if (!hasAccess) {
    const isEnded = new Date(voting.end_at) < new Date()
    return (
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.push(`/vote/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Voting
        </Button>

        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <Lock className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">Hasil Voting Belum Tersedia</h3>
          <p className="mb-1 text-sm text-muted-foreground">
            {voting.reveal_mode === 'after_vote'
              ? 'Anda harus berpartisipasi dalam voting ini terlebih dahulu'
              : 'Hasil voting akan ditampilkan setelah voting berakhir'}
          </p>
          <p className="text-sm text-muted-foreground">
            {voting.reveal_mode === 'after_vote'
              ? 'untuk melihat hasilnya.'
              : `pada ${new Date(voting.end_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}.`}
          </p>
        </div>
      </main>
    )
  }

  const isEnded = new Date(voting.end_at) < new Date()
  const timeLeft = formatDistanceToNow(new Date(voting.end_at), {
    addSuffix: true,
    locale: idLocale
  })

  const totalVotes = votes.length
  const uniqueVoters = new Set(votes.map(vote => vote.voter_uuid)).size

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Button
        variant="ghost"
        className="mb-8"
        onClick={() => router.push(`/vote/${id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Voting
      </Button>

      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">{voting.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {voting.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div>
              Status: <span className="font-medium">{isEnded ? 'Berakhir' : 'Aktif'}</span>
            </div>
            <div>•</div>
            <div>
              {isEnded ? 'Berakhir' : 'Berakhir'} {timeLeft}
            </div>
            <div>•</div>
            <div>
              {totalVotes} suara dari {uniqueVoters} pemilih
            </div>
            {user?.id === voting.creator_id && (
              <>
                <div>•</div>
                <div className="text-primary">
                  Anda adalah pembuat voting ini
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Hasil Voting</h2>
          </div>
          <div className="p-4">
            <ResultChart options={options} votes={votes} />
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Detail Opsi</h2>
          </div>
          <div className="divide-y">
            {options.map(option => {
              const optionVotes = votes.filter(vote => vote.option_id === option.id).length
              const percentage = totalVotes > 0 ? (optionVotes / totalVotes * 100).toFixed(1) : '0'
              
              return (
                <div key={option.id} className="flex items-center justify-between p-4">
                  <span>{option.text}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {optionVotes} suara
                    </span>
                    <div className="w-16 text-right font-medium">
                      {percentage}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
} 