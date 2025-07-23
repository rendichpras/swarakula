'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { VotingList } from '@/components/VotingList'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login')
    }
  }, [user, router, loading])

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setLoading(false)
      
      if (!session) {
        router.push('/auth/login')
      }
    }

    checkSession()
  }, [router])

  if (loading) {
    return (
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-8 h-8 w-48 rounded bg-muted"></div>
          <div className="h-[400px] rounded bg-muted"></div>
        </div>
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Kelola voting yang Anda buat
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/create">
            <Plus className="mr-2 h-4 w-4" />
            Buat Voting
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Voting Aktif Anda</h2>
          <VotingList userId={user.id} />
        </div>
      </div>
    </main>
  )
} 