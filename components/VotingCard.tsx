'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShareVoting } from '@/components/ShareVoting'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { useUser } from '@/hooks/useUser'
import { MoreVertical, Trash2, Ban, BarChart } from 'lucide-react'
import { toast } from 'sonner'

type Voting = Database['public']['Tables']['votings']['Row']

interface VotingCardProps {
  voting: Voting
  onVotingUpdate?: (voting: Voting) => void
  onVotingDelete?: (votingId: string) => void
}

export function VotingCard({ voting: initialVoting, onVotingUpdate, onVotingDelete }: VotingCardProps) {
  const [voting, setVoting] = useState<Voting>(initialVoting)
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)
  const router = useRouter()
  const { user } = useUser()
  const supabase = createClient()
  const isCreator = user?.id === voting.creator_id
  const isEnded = new Date(voting.end_at) < new Date()

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

    // Subscribe to realtime changes for votes
    const votesChannel = supabase
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

    // Subscribe to realtime changes for voting updates
    const votingChannel = supabase
      .channel(`voting_${voting.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votings',
        filter: `id=eq.${voting.id}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedVoting = payload.new as Voting
          setVoting(updatedVoting)
          onVotingUpdate?.(updatedVoting)
        } else if (payload.eventType === 'DELETE') {
          onVotingDelete?.(voting.id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(votesChannel)
      supabase.removeChannel(votingChannel)
    }
  }, [voting.id, supabase, onVotingUpdate, onVotingDelete])

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('votings')
        .delete()
        .eq('id', voting.id)

      if (error) throw error

      toast.success('Voting berhasil dihapus')
      onVotingDelete?.(voting.id)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menghapus voting')
    }
  }

  const handleEndVoting = async () => {
    try {
      const { data, error } = await supabase
        .from('votings')
        .update({ end_at: new Date().toISOString() })
        .eq('id', voting.id)
        .select()
        .single()

      if (error) throw error

      toast.success('Voting telah diakhiri')
      if (data) {
        setVoting(data)
        onVotingUpdate?.(data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal mengakhiri voting')
    }
  }

  const timeLeft = formatDistanceToNow(new Date(voting.end_at), {
    addSuffix: true,
    locale: idLocale
  })

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
      <div className="space-y-1.5 p-6">
        <div className="flex items-start justify-between">
          <h3 className="line-clamp-1 text-lg font-semibold leading-none tracking-tight">
            {voting.title}
          </h3>
          <div className="flex items-center gap-2">
            <ShareVoting votingId={voting.id} title={voting.title} />
            {isCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isEnded && (
                    <DropdownMenuItem onClick={() => setIsEndDialogOpen(true)}>
                      <Ban className="mr-2 h-4 w-4" />
                      Akhiri Voting
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {voting.description}
        </p>
        <div className="flex items-center gap-2 pt-1.5">
          <span className="text-xs text-muted-foreground">
            {isEnded ? 'Berakhir' : 'Berakhir'} {timeLeft}
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <Link href={`/vote/${voting.id}/stats`}>
                <BarChart className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant={isEnded ? "outline" : "default"}>
              <Link href={`/vote/${voting.id}`}>
                {isEnded ? 'Lihat Hasil' : 'Lihat & Vote'}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Voting?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Voting ini akan dihapus secara permanen
              beserta semua data terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Akhiri Voting?</AlertDialogTitle>
            <AlertDialogDescription>
              Voting akan diakhiri sekarang dan tidak akan menerima suara baru.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndVoting}>
              Akhiri
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 