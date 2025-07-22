import { VotingForm } from '@/components/VotingForm'

export default function CreateVotingPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">Buat Voting Baru</h1>
          <p className="text-lg text-muted-foreground">
            Isi formulir di bawah untuk membuat voting baru.
            Pastikan mengisi semua informasi dengan lengkap.
          </p>
        </div>

        <VotingForm />
      </div>
    </main>
  )
} 