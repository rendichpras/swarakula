import { Vote } from 'lucide-react'

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
        </div>
      </section>
    </main>
  )
}
