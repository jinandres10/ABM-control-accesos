import { createServerClient } from '@supabase/ssr'
import { redirect, type Handle } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

const RUTAS_PROTEGIDAS = ['/edificios', '/perfiles']

export const handle: Handle = async ({ event, resolve }) => {

  // ✅ cliente Supabase SSR moderno
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),

        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, {
              path: '/',
              ...options
            })
          })
        }
      }
    }
  )

  // ✅ obtener usuario autenticado
  const {
    data: { user }
  } = await event.locals.supabase.auth.getUser()

  // ✅ obtener perfil del usuario (si está logueado)
  let perfil = null

  if (user) {
    const { data, error } = await event.locals.supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // ⚠️ no romper la app si falla (ej: perfil aún no creado)
    if (!error) {
      perfil = data
    }
  }

  if (perfil?.bloqueada) {
  throw redirect(303, '/bloqueado')
}

  // ✅ guardar en locals (disponible en toda la app)
  event.locals.user = user
  event.locals.session = user ? { user } as any : null
  event.locals.perfil = perfil

  // ✅ proteger rutas
  const protegida = RUTAS_PROTEGIDAS.some((ruta) =>
    event.url.pathname.startsWith(ruta)
  )

  if (protegida && !user) {
    throw redirect(303, '/login')
  }

  if (event.url.pathname.startsWith('/admin')) {
	if (!user || perfil?.rol !== 'admin') {
		throw redirect(303, '/')
	}
}

  return resolve(event)
}