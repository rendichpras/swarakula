'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ShareVoting } from '@/components/ShareVoting'
import { createClient } from '@/lib/supabase'
import { getVoterUUID } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { BarChart } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

type Voting = Database['public']['Tables']['votings']['Row']
type Option = Database['public']['Tables']['options']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

interface VotePageProps {
  params: Promise<{ id: string }>
}

export default function VotePage({ params }: VotePageProps) {
  const [voting, setVoting] = useState<Voting | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const router = useRouter()
  const { user } = useUser()
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

        const voterUUID = getVoterUUID()
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .eq('voting_id', id)
          .eq('voter_uuid', voterUUID)

        if (votesError) throw votesError

        setVoting(voting)
        setOptions(options)
        setHasVoted(votes.length > 0)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Gagal memuat data voting')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchVoting()
  }, [id, router, supabase])

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

  const handleVote = async () => {
    if (!voting || selectedOptions.length === 0) {
      toast.error('Pilih minimal satu opsi')
      return
    }
    
    setSubmitting(true)
    toast.promise(
      async () => {
        try {
          const voterUUID = getVoterUUID()
          
          // Cek apakah user sudah vote untuk opsi yang dipilih
          const { data: existingVotes, error: checkError } = await supabase
            .from('votes')
            .select('option_id')
            .eq('voting_id', voting.id)
            .eq('voter_uuid', voterUUID)

          if (checkError) throw checkError

          // Filter out opsi yang sudah di-vote
          const votedOptionIds = existingVotes?.map(v => v.option_id) || []
          const newOptions = selectedOptions.filter(optionId => !votedOptionIds.includes(optionId))

          if (newOptions.length === 0) {
            setHasVoted(true)
            return { message: 'Anda sudah memilih semua opsi ini' }
          }

          // Insert vote untuk opsi yang belum di-vote
          const votes = newOptions.map(optionId => ({
            voting_id: voting.id,
            option_id: optionId,
            voter_uuid: voterUUID
          }))

          const { error } = await supabase.from('votes').insert(votes)
          if (error) throw error

          setHasVoted(true)
          return { message: 'Vote berhasil disimpan' }
        } catch (error) {
          console.error('Error submitting vote:', error)
          throw error
        }
      },
      {
        loading: 'Menyimpan vote...',
        success: (data) => data.message,
        error: 'Gagal menyimpan vote. Silakan coba lagi.',
      }
    )
    setSubmitting(false)
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
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="font-heading text-3xl font-bold md:text-4xl">{voting.title}</h1>
              <p className="text-lg text-muted-foreground">
                {voting.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {isEnded ? 'Berakhir' : timeLeft}
              </p>
            </div>
            <ShareVoting votingId={voting.id} title={voting.title} />
          </div>
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
        ) : (
          <div className="rounded-lg border p-8 text-center">
            <h3 className="mb-2 text-lg font-medium">
              {hasVoted ? 'Terima kasih atas partisipasi Anda!' : 'Voting telah berakhir'}
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {hasVoted 
                ? voting.reveal_mode === 'after_vote'
                  ? 'Anda dapat melihat hasil voting di halaman statistik.'
                  : 'Hasil akan ditampilkan setelah voting berakhir.'
                : isEnded
                  ? 'Anda dapat melihat hasil voting di halaman statistik.'
                  : 'Voting ini telah berakhir.'}
            </p>
            {user?.id === voting.creator_id || 
             (voting.reveal_mode === 'after_vote' && hasVoted) ||
             (voting.reveal_mode === 'after_end' && isEnded) ? (
              <Button asChild>
                <Link href={`/vote/${voting.id}/stats`}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Lihat Statistik
                </Link>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </main>
  )
} 