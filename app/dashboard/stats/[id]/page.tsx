'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResultChart } from '@/components/ResultChart'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { ArrowLeft, Users } from 'lucide-react'
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
  const router = useRouter()
  const { user } = useUser()
  const { id } = use(params)
  const supabase = createClient()

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login')
    }
  }, [user, router, loading])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: voting, error: votingError } = await supabase
          .from('votings')
          .select('*')
          .eq('id', id)
          .single()

        if (votingError) throw votingError

        // Verify ownership
        if (voting.creator_id !== user?.id) {
          router.push('/dashboard')
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

        setVoting(voting)
        setOptions(options)
        setVotes(votes)
      } catch (error) {
        console.error('Error:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [id, router, supabase, user])

  useEffect(() => {
    if (voting) {
      const channel = supabase
        .channel(`votes_${id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `voting_id=eq.${id}`
        }, async () => {
          const { data } = await supabase
            .from('votes')
            .select('*')
            .eq('voting_id', id)

          if (data) {
            setVotes(data)
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [id, supabase, voting])

  if (loading) {
    return (
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 rounded bg-muted"></div>
          <div className="space-y-4">
            <div className="h-32 rounded-lg bg-muted"></div>
            <div className="h-[400px] rounded-lg bg-muted"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!voting || !user) return null

  const uniqueVoters = new Set(votes.map(vote => vote.voter_uuid)).size

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Button>
          <h1 className="text-3xl font-bold">{voting.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {voting.description}
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Statistik Pemilih
            </CardTitle>
            <CardDescription>
              Ringkasan partisipasi pemilih dalam voting ini
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{votes.length}</div>
              <div className="text-sm text-muted-foreground">Total Suara</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{uniqueVoters}</div>
              <div className="text-sm text-muted-foreground">Jumlah Pemilih</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hasil Voting</CardTitle>
            <CardDescription>
              Distribusi suara untuk setiap opsi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResultChart options={options} votes={votes} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 