'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Vote, Plus } from 'lucide-react'
import { UserButton } from '@/components/UserButton'
import { useUser } from '@/hooks/useUser'

export function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:h-16">
        <Link href="/" className="flex items-center space-x-2">
          <Vote className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-sm font-bold sm:text-base">SwaraKula</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {user && pathname !== '/create' && (
            <Button asChild size="sm" className="sm:size-md">
              <Link href="/create" className="flex items-center whitespace-nowrap">
                <Plus className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Buat Voting</span>
              </Link>
            </Button>
          )}
          <UserButton />
        </div>
      </div>
    </nav>
  )
} 