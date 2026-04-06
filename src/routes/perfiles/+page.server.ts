import type { PageServerLoad } from './$types'
import { supabase } from '$lib/supabase'
import type { Perfil } from '$lib/types'

export const load: PageServerLoad = async () => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) console.error('Error cargando perfiles:', error.message)

  return { perfiles: (data ?? []) as Perfil[] }
}