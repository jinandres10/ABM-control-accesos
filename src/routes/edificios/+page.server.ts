import type { PageServerLoad } from './$types'
import { supabase } from '$lib/supabase'
import type { Edificio } from '$lib/types'

export const load: PageServerLoad = async () => {
  const { data, error } = await supabase
    .from('edificios')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) console.error('Error cargando edificios:', error.message)

  return { edificios: (data ?? []) as Edificio[] }
}