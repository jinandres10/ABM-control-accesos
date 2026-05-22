import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals }) => {

  const { supabase } = locals

  const { data, error } = await supabase
    .from('ingreso_egreso')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(100)

  if (error) {
    return json({ error: 'Error obteniendo registros' }, { status: 500 })
  }

  return json({ data })
}


export const POST: RequestHandler = async ({ request, locals }) => {

  const { supabase, user } = locals

  if (!user) {
    return json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()

  const {
    id_edificio,
    geo_usuario_lat,
    geo_usuario_lng
  } = body

  // 🔍 obtener edificio
  const { data: edificio } = await supabase
    .from('edificios')
    .select('*')
    .eq('id', id_edificio)
    .single()

  if (!edificio) {
    return json({ error: 'Edificio no encontrado' }, { status: 404 })
  }

  // 📏 calcular distancia (simplificado)
  const distancia = 0 // después mejoramos esto

  const { error } = await supabase
    .from('ingreso_egreso')
    .insert({
      id_usuario: user.id,
      usuario: user.email,

      id_edificio,
      nombre_edificio: edificio.nombre,

      geo_usuario_lat,
      geo_usuario_lng,

      geo_edificio_lat: edificio.latitude,
      geo_edificio_lng: edificio.longitude,

      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().getHours(),

      distancia_metros: distancia,
      gps_disponible: true,

      device_name: 'web',
      os: 'web',
      browser: 'web',

      online_status: true,
      fue_offline: false
    })

  if (error) {
    return json({ error: 'Error guardando registro' }, { status: 500 })
  }

  return json({ ok: true })
}