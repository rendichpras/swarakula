'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { Database } from '@/types/supabase'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Option = Database['public']['Tables']['options']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

interface ResultChartProps {
  options: Option[]
  votes: Vote[]
}

export function ResultChart({ options, votes: initialVotes }: ResultChartProps) {
  const [votes, setVotes] = useState(initialVotes)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`votes_${options[0]?.voting_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `voting_id=eq.${options[0]?.voting_id}`
      }, async () => {
        // Fetch updated votes
        const { data: updatedVotes } = await supabase
          .from('votes')
          .select('*')
          .eq('voting_id', options[0]?.voting_id)

        if (updatedVotes) {
          setVotes(updatedVotes)
          setLastUpdate(new Date())
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [options, supabase])

  const data = useMemo(() => {
    return options.map(option => {
      const voteCount = votes.filter(vote => vote.option_id === option.id).length
      const total = votes.length
      const percentage = total > 0 ? ((voteCount / total) * 100).toFixed(1) : '0'
      return {
        name: option.text,
        votes: voteCount,
        percentage
      }
    })
  }, [options, votes])

  return (
    <div className="space-y-6">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              left: 16,
              right: 16,
              top: 20,
              bottom: 0
            }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={150}
              tickFormatter={(value) => 
                value.length > 25 ? value.substring(0, 22) + '...' : value
              }
            />
            <Bar
              dataKey="votes"
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
              maxBarSize={30}
            >
              <LabelList
                position="right"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value) => (typeof value === 'number' ? `${value} suara` : '')}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          Terakhir diperbarui {formatDistanceToNow(lastUpdate, { locale: idLocale, addSuffix: true })}
        </span>
      </div>
    </div>
  )
} 