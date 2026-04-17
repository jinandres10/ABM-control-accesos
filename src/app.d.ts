// See https://kit.svelte.dev/docs/types#app
import type { SupabaseClient, Session, User } from '@supabase/supabase-js'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
      session: Session | null
      user: User | null
      perfil: any | null
    }

    interface PageData {
      session: Session | null
      user: User | null
    }
  }
}

export {}