'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Database } from '@/types/supabase'

type Option = Database['public']['Tables']['options']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

interface ResultChartProps {
  options: Option[]
  votes: Vote[]
}

export function ResultChart({ options, votes }: ResultChartProps) {
  const data = useMemo(() => {
    return options.map(option => {
      const voteCount = votes.filter(vote => vote.option_id === option.id).length
      return {
        name: option.text,
        votes: voteCount
      }
    })
  }, [options, votes])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(var(--foreground))' }}
            tickLine={{ stroke: 'hsl(var(--foreground))' }}
          />
          <YAxis
            tick={{ fill: 'hsl(var(--foreground))' }}
            tickLine={{ stroke: 'hsl(var(--foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)'
            }}
          />
          <Bar
            dataKey="votes"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 