import { createServerClient } from '@supabase/ssr'
import { redirect, type Handle } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

/**
 * =========================================
 * RUTAS PROTEGIDAS
 * -----------------------------------------
 * Todas las rutas que requieren autenticación.
 * Se evalúan por prefijo (startsWith).
 * =========================================
 */
const RUTAS_PROTEGIDAS = ['/edificios', '/perfiles', '/dashboard']



export const handle: Handle = async ({ event, resolve }) => {

  /* =============================
     1️⃣ CREAR CLIENTE SUPABASE SSR
     =============================
     - Maneja cookies automáticamente
     - Permite mantener sesión en SSR
  */
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),

        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, {
              path: '/', // 🔥 CRÍTICO para que funcione en toda la app
              ...options
            })
          })
        }
      }
    }
  )

  /* =============================
     2️⃣ OBTENER USUARIO AUTENTICADO
     =============================
     - Si no hay sesión → user = null
  */
  const {
    data: { user }
  } = await event.locals.supabase.auth.getUser()

  /* =============================
     3️⃣ OBTENER PERFIL DEL USUARIO
     =============================
     - Se busca por ID (relación con auth.users)
     - Puede ser null si aún no existe
  */
  let perfil = null

  if (user) {
    const { data, error } = await event.locals.supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id) // 🔥 BEST PRACTICE: usar ID, no email
      .maybeSingle()

    // ⚠️ No romper la app si falla
    if (error) {
      console.error('Error cargando perfil:', error)
    } else {
      perfil = data
    }
  }

  /* =============================
     4️⃣ VALIDAR USUARIO BLOQUEADO
     =============================
     - Seguridad global
     - Aplica a TODA la aplicación
  */
  if (perfil?.bloqueada) {
    throw redirect(303, '/bloqueado')
  }

  /* =============================
     5️⃣ GUARDAR EN LOCALS
     =============================
     - Disponible en:
       ✔ +layout.server.ts
       ✔ +page.server.ts
       ✔ endpoints
  */
  event.locals.user = user
  event.locals.session = user ? { user } as any : null
  event.locals.perfil = perfil // 🔥 CLAVE para autorización por rol

  

  /* =============================
     6️⃣ PROTEGER RUTAS GENERALES
     =============================
     - Si intenta acceder sin login → redirect
  */
  const protegida = RUTAS_PROTEGIDAS.some((ruta) =>
    event.url.pathname.startsWith(ruta)
  )

  if (protegida && !user) {
    throw redirect(303, '/login')
  }

  /* =============================
     7️⃣ PROTEGER RUTAS ADMIN
     =============================
     - Solo usuarios con rol 'admin'
  */
  if (event.url.pathname.startsWith('/admin')) {
    if (!user || perfil?.rol !== 'admin') {
      throw redirect(303, '/')
    }
  }

  /* =============================
     8️⃣ CONTINUAR REQUEST
     =============================
     - Si pasa todas las validaciones
  */
  return resolve(event)
}