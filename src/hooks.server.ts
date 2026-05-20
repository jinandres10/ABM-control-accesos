import { createServerClient } from '@supabase/ssr'
import { redirect, type Handle } from '@sveltejs/kit'
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public'

/**
 * =========================================
 * RUTAS PROTEGIDAS
 * =========================================
 */
const RUTAS_PROTEGIDAS = [
  '/edificios',
  '/perfiles',
  '/dashboard'
]

export const handle: Handle = async ({ event, resolve }) => {

  /* =========================================
     1️⃣ CREAR CLIENTE SSR
  ========================================= */
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

  /* =========================================
     2️⃣ OBTENER SESIÓN
  ========================================= */
  const {
    data: { session }
  } = await event.locals.supabase.auth.getSession()

  /* =========================================
     3️⃣ OBTENER USER
  ========================================= */
  const {
    data: { user }
  } = await event.locals.supabase.auth.getUser()

  /* =========================================
     4️⃣ CARGAR PERFIL
  ========================================= */
  let perfil = null

  if (user) {

    const { data, error } =
      await event.locals.supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    if (error) {

      console.error(
        'Error cargando perfil:',
        error
      )

    } else {

      perfil = data

    }
  }

  /* =========================================
     5️⃣ VALIDAR BLOQUEO
  ========================================= */
  if (perfil?.bloqueada) {

    throw redirect(
      303,
      '/bloqueado'
    )
  }

  /* =========================================
     6️⃣ GUARDAR EN LOCALS
  ========================================= */
  event.locals.session = session
  event.locals.user = user
  event.locals.perfil = perfil

  /* =========================================
     7️⃣ PROTEGER RUTAS
  ========================================= */
  const protegida =
    RUTAS_PROTEGIDAS.some((ruta) =>
      event.url.pathname.startsWith(ruta)
    )

  if (protegida && !user) {

    throw redirect(
      303,
      '/login'
    )
  }

  /* =========================================
     8️⃣ PROTEGER ADMIN
  ========================================= */
  if (
    event.url.pathname.startsWith('/admin')
  ) {

    if (
      !user ||
      perfil?.rol !== 'admin'
    ) {

      throw redirect(303, '/')
    }
  }

  /* =========================================
     9️⃣ CONTINUAR REQUEST
  ========================================= */
  return resolve(event, {
	filterSerializedResponseHeaders(name) {
		return name === 'content-range'
			|| name === 'x-supabase-api-version';
	}
  })
}