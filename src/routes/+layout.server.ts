import type { LayoutServerLoad } from './$types'
import { supabase } from '$lib/supabase'

export const load: LayoutServerLoad = async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  return { session }
}