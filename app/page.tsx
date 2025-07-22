import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Vote } from 'lucide-react'
import { VotingList } from '@/components/VotingList'

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col">
      <section className="flex flex-1 flex-col items-center justify-center space-y-10 px-4 py-10 sm:px-6 sm:py-16 md:py-24">
        <div className="flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <Vote className="h-12 w-12 sm:h-16 sm:w-16" />
          <h1 className="font-heading text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Platform Voting Online Universal
          </h1>
          <p className="max-w-[42rem] text-base leading-normal text-muted-foreground sm:text-lg md:text-xl md:leading-8">
            Buat dan kelola voting dengan mudah. Dapatkan hasil secara real-time.
            Gratis untuk semua orang.
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Button className="w-full sm:w-auto" asChild size="lg">
              <Link href="/create">Buat Voting</Link>
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" size="lg" asChild>
              <Link href="#voting-list">Lihat Voting</Link>
            </Button>
          </div>
        </div>
      </section>

      <section
        id="voting-list"
        className="w-full bg-muted/50 px-4 py-12 sm:px-6 sm:py-16 md:py-24"
      >
        <div className="container mx-auto max-w-screen-xl">
          <div className="mx-auto mb-8 flex max-w-[58rem] flex-col items-center space-y-4 text-center sm:mb-12">
            <h2 className="font-heading text-2xl font-bold leading-[1.1] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
              Voting yang Sedang Berlangsung
            </h2>
            <p className="max-w-[85%] text-sm leading-normal text-muted-foreground sm:text-base md:text-lg lg:leading-7">
              Pilih dan berikan suara Anda pada voting yang tersedia.
              Hasil akan ditampilkan secara real-time.
            </p>
          </div>

          <VotingList />
        </div>
      </section>
    </main>
  )
}
