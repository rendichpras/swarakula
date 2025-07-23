'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { Plus, Trash2 } from 'lucide-react'

const formSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi'),
  description: z.string().min(1, 'Deskripsi harus diisi'),
  end_at: z.string().min(1, 'Tanggal berakhir harus diisi'),
  multiple_choice: z.boolean(),
  reveal_mode: z.enum(['after_vote', 'after_end']),
  options: z.array(z.object({ value: z.string() })).min(2, 'Minimal harus ada 2 opsi')
})

type FormValues = z.infer<typeof formSchema>

export function VotingForm() {
  const router = useRouter()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      end_at: '',
      multiple_choice: false,
      reveal_mode: 'after_vote',
      options: [{ value: '' }, { value: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options"
  })

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('Anda harus login untuk membuat voting')
      return
    }
    
    setIsSubmitting(true)
    toast.promise(
      async () => {
        try {
          const { data: voting, error: votingError } = await supabase
            .from('votings')
            .insert({
              creator_id: user.id,
              title: data.title,
              description: data.description,
              end_at: new Date(data.end_at).toISOString(),
              multiple_choice: data.multiple_choice,
              reveal_mode: data.reveal_mode
            })
            .select()
            .single()

          if (votingError) throw votingError

          const options = data.options.map(option => ({
            voting_id: voting.id,
            text: option.value
          }))

          const { error: optionsError } = await supabase
            .from('options')
            .insert(options)

          if (optionsError) throw optionsError

          router.push(`/dashboard`)
          router.refresh()
          
          return voting
        } catch (error) {
          console.error('Error creating voting:', error)
          throw error
        }
      },
      {
        loading: 'Membuat voting...',
        success: 'Voting berhasil dibuat!',
        error: 'Gagal membuat voting. Silakan coba lagi.',
      }
    )
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan judul voting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan tentang voting ini"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal Berakhir</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="multiple_choice"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Pilihan Ganda</FormLabel>
                <FormDescription>
                  Izinkan pemilih memilih lebih dari satu opsi
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reveal_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mode Tampilkan Hasil</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mode tampilan hasil" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="after_vote">Setelah Voting</SelectItem>
                  <SelectItem value="after_end">Setelah Berakhir</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Opsi Voting</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={form.control}
                name={`options.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder={`Opsi ${index + 1}`} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {index >= 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => append({ value: '' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Opsi
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Buat Voting'}
        </Button>
      </form>
    </Form>
  )
} 