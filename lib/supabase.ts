import { createBrowserClient } from '@supabase/ssr'
import { v4 as uuidv4 } from 'uuid'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const getVoterUUID = (): string => {
  if (typeof window === 'undefined') {
    return uuidv4() // Fallback untuk server-side
  }

  const key = 'voter_uuid'
  const storedUUID = localStorage.getItem(key)
  
  if (!storedUUID) {
    const newUUID = uuidv4()
    localStorage.setItem(key, newUUID)
    return newUUID
  }

  return storedUUID
} 