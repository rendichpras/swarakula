import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        }
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Jika user mencoba mengakses halaman create tanpa login
  if (request.nextUrl.pathname === '/dashboard' && !session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Jika user mencoba mengakses halaman login sudah login
  if (request.nextUrl.pathname === '/auth/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard', '/auth/callback', '/auth/login']
} 