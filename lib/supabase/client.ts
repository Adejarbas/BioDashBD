import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Acessa variáveis de ambiente de forma segura em ambientes onde `process`
// pode não estar definido (ex.: bundles client-side). Usamos `globalThis` e
// um cast local para `any` para manter checagens simples sem exigir
// `@types/node`.
const env = (typeof globalThis !== "undefined" && (globalThis as any).process && (globalThis as any).process.env)
  ? (globalThis as any).process.env
  : ({} as Record<string, string | undefined>)

/**
 * Verifica se as variáveis de ambiente do Supabase estão configuradas.
 * Não comparar com valores fixos/secretos — apenas checar presença como string não vazia.
 */
export const isSupabaseConfigured =
  typeof env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  env.NEXT_PUBLIC_SUPABASE_URL!.length > 0 &&
  typeof env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.length > 0

// Cria uma instância singleton do cliente Supabase para componentes client-side.
// `createClientComponentClient` lê as variáveis `NEXT_PUBLIC_*` automaticamente.
export const supabase = createClientComponentClient()
