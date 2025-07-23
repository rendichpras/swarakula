'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Vote, Plus, Moon, Sun } from 'lucide-react'
import { UserButton } from '@/components/UserButton'
import { useUser } from '@/hooks/useUser'
import { useTheme } from 'next-themes'

export function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { theme, setTheme } = useTheme()

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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          {user ? (
            <UserButton />
          ) : (
            <Button asChild size="sm" variant="outline" className="sm:size-md">
              <Link href="/auth/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
} 