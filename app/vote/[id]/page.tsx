'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ResultChart } from '@/components/ResultChart'
import { createClient } from '@/lib/supabase'
import { getVoterUUID } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Voting = Database['public']['Tables']['votings']['Row']
type Option = Database['public']['Tables']['options']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

interface VotePageProps {
  params: Promise<{ id: string }>
}

// Enable caching for fetch requests in this page
export const fetchCache = 'default-cache'

export default function VotePage({ params }: VotePageProps) {
  const router = useRouter()
  const [voting, setVoting] = useState<Voting | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const { id } = use(params)

  useEffect(() => {
    const fetchVoting = async () => {
      try {
        const { data: voting, error: votingError } = await supabase
          .from('votings')
          .select('*')
          .eq('id', id)
          .single()

        if (votingError) throw votingError

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

        const voterUUID = getVoterUUID()
        const userVote = votes.find(vote => vote.voter_uuid === voterUUID)

        setVoting(voting)
        setOptions(options)
        setVotes(votes)
        setHasVoted(!!userVote)
      } catch (error) {
        console.error('Error fetching voting:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchVoting()

    // Subscribe to realtime changes
    const votesSubscription = supabase
      .channel('votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `voting_id=eq.${id}`
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            setVotes(current => [...current, payload.new as Vote])
          }
        }
      )
      .subscribe()

    return () => {
      votesSubscription.unsubscribe()
    }
  }, [id, router, supabase])

  const handleVote = async () => {
    if (!voting || selectedOptions.length === 0) return
    setSubmitting(true)

    try {
      const voterUUID = getVoterUUID()
      const votes = selectedOptions.map(optionId => ({
        voting_id: voting.id,
        option_id: optionId,
        voter_uuid: voterUUID
      }))

      const { error } = await supabase.from('votes').insert(votes)
      if (error) throw error

      setHasVoted(true)
    } catch (error) {
      console.error('Error submitting vote:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOptionChange = (optionId: string) => {
    if (voting?.multiple_choice) {
      setSelectedOptions(current =>
        current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const showResults = () => {
    if (!voting) return false
    if (voting.reveal_mode === 'after_vote' && hasVoted) return true
    if (voting.reveal_mode === 'after_end' && new Date(voting.end_at) < new Date()) return true
    return false
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="h-[400px] w-full max-w-2xl rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  if (!voting) return null

  const isEnded = new Date(voting.end_at) < new Date()
  const timeLeft = formatDistanceToNow(new Date(voting.end_at), {
    addSuffix: true,
    locale: idLocale
  })

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">{voting.title}</h1>
          <p className="text-lg text-muted-foreground">
            {voting.description}
          </p>
          <p className="text-sm text-muted-foreground">
            {isEnded ? 'Berakhir' : timeLeft}
          </p>
        </div>

        {!hasVoted && !isEnded ? (
          <div className="space-y-8">
            {voting.multiple_choice ? (
              <div className="space-y-4">
                {options.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleOptionChange(option.id)}
                    />
                    <label
                      htmlFor={option.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.text}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup
                value={selectedOptions[0]}
                onValueChange={handleOptionChange}
              >
                {options.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <label
                      htmlFor={option.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.text}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            )}

            <Button
              className="w-full"
              disabled={selectedOptions.length === 0 || submitting}
              onClick={handleVote}
            >
              {submitting ? 'Menyimpan...' : 'Kirim Vote'}
            </Button>
          </div>
        ) : showResults() ? (
          <ResultChart options={options} votes={votes} />
        ) : (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            {hasVoted
              ? 'Hasil akan ditampilkan setelah voting berakhir'
              : 'Voting telah berakhir'}
          </div>
        )}
      </div>
    </main>
  )
} 