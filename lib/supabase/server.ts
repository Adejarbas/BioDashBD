import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const env = process.env

// Verifica se variáveis do Supabase existem
export const isSupabaseConfigured =
  typeof env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase not configured. Check environment variables.")
  }

  const cookieStore = await cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            
          }
        },
      },
    }
  )
}
