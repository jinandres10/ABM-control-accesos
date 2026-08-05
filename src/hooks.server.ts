import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * =========================================
 * 🔐 RUTAS PROTEGIDAS
 * =========================================
 *
 * Todas las rutas que requieren:
 * - sesión activa
 * - usuario autenticado
 *
 * 🔥 IMPORTANTE:
 * Se valida por prefijo usando startsWith()
 *
 * Ejemplo:
 * '/edificios'
 * protege:
 *   ✔ /edificios
 *   ✔ /edificios/nuevo
 *   ✔ /edificios/123
 */
const RUTAS_PROTEGIDAS = ['/edificios', '/perfiles', '/ingresos-egresos', '/dashboard', '/admin'];

/**
 * =========================================
 * HANDLE GLOBAL
 * =========================================
 *
 * Este archivo se ejecuta:
 * ✔ en TODAS las requests
 * ✔ antes de cargar cualquier página
 * ✔ antes de endpoints API
 *
 * RESPONSABILIDADES:
 * -----------------------------------------
 * 1️⃣ Crear cliente Supabase SSR
 * 2️⃣ Recuperar sesión desde cookies
 * 3️⃣ Proteger rutas privadas
 * 4️⃣ Cargar perfil del usuario
 * 5️⃣ Validar bloqueos
 * 6️⃣ Validar roles admin
 * 7️⃣ Exponer datos globales en locals
 */
export const handle: Handle = async ({ event, resolve }) => {
	/* =========================================
     1️⃣ CREAR CLIENTE SUPABASE SSR
  =========================================
  
     🔥 MUY IMPORTANTE:
     Este cliente:
     
     ✔ lee cookies automáticamente
     ✔ refresca tokens
     ✔ mantiene la sesión SSR
     ✔ sincroniza auth entre frontend/backend

     Sin esto:
     ❌ la sesión NO persiste
     ❌ user queda null
  */
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			/**
			 * =====================================
			 * LEER COOKIES
			 * =====================================
			 */
			getAll: () => event.cookies.getAll(),

			/**
			 * =====================================
			 * ESCRIBIR COOKIES
			 * =====================================
			 *
			 * Supabase usa esto para:
			 * ✔ access_token
			 * ✔ refresh_token
			 * ✔ refresh automático
			 */
			setAll: (cookies) => {
				cookies.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						/**
						 * 🔥 CRÍTICO
						 * Hace disponible la cookie
						 * en TODA la aplicación
						 */
						path: '/',

						...options
					});
				});
			}
		}
	});

	/* =========================================
     2️⃣ OBTENER SESIÓN
  =========================================
  
/* =========================================
   2️⃣ VALIDAR SESIÓN Y USUARIO
========================================= */

	/**
	 * SESSION:
	 * se utiliza para SSR
	 */
	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();

	/**
	 * USER:
	 * SIEMPRE validar contra Supabase Auth
	 * (evita usuarios inconsistentes)
	 */
	const {
		data: { user },
		error: userError
	} = await event.locals.supabase.auth.getUser();
	if (userError) {
		console.error('Error obteniendo usuario:', userError.message);
	}
	/**
	 * Path actual
	 * Ej:
	 * /dashboard
	 * /edificios
	 * /admin/usuarios
	 */
	const path = event.url.pathname;

	/* =========================================
     3️⃣ REDIRECCIÓN SI YA ESTÁ LOGUEADO
  =========================================
  
     Evita volver al login
     cuando la sesión ya existe.
  */
	if (user && path === '/login') {
		throw redirect(303, '/dashboard');
	}

	/* =========================================
     4️⃣ VALIDAR RUTAS PROTEGIDAS
  =========================================
  
     Si:
       ✔ la ruta es protegida
       ❌ NO hay user

     → redireccionar a login
  */
	const protegida = RUTAS_PROTEGIDAS.some((ruta) => path.startsWith(ruta));

	if (protegida && !user) {
		throw redirect(303, '/login');
	}

	/* =========================================
     5️⃣ CARGAR PERFIL
  =========================================
  
     SOLO si existe usuario autenticado.

     Tabla:
       perfiles

     Relación:
       perfiles.id = auth.users.id
  */
	let perfil = null;

	if (user) {
		const { data, error } = await event.locals.supabase
			.from('perfiles')
			.select('*')
			.eq('id', user.id)
			.maybeSingle();

		if (error) {
			console.error('Error cargando perfil:', error.message);

			// A profile read error must not turn a transient database issue into a logout.
			// The protected-route guard below still prevents access without a valid profile.
			perfil = null;
		} else {
			perfil = data;
		}
	}

	/* =========================================
     6️⃣ VALIDAR USUARIO BLOQUEADO
  =========================================
  
     Seguridad global:
     un usuario bloqueado
     NO puede acceder.
  */
	if (perfil?.bloqueada) {
		throw redirect(303, '/sin-permiso');
	}

	/**
	 * =========================================
	 * 🚫 OPERADOR
	 * =========================================
	 *
	 * Seguridad adicional:
	 * si el usuario tiene sesión activa
	 * pero es operador,
	 * no puede navegar por el panel.
	 */
	if (
		perfil?.rol === 'operador' &&
		!path.startsWith('/api/') &&
		path !== '/login' &&
		path !== '/sin-permiso'
	) {
		throw redirect(303, '/sin-permiso');
	}
	/* =========================================
     7️⃣ PROTEGER RUTAS ADMIN
  =========================================
  
     Requiere:
       ✔ login
       ✔ rol = admin
  */
	if (path.startsWith('/admin')) {
		if (!user || perfil?.rol !== 'admin') {
			/**
			 * Redirección segura
			 */
			throw redirect(303, '/');
		}
	}

	/* =========================================
     8️⃣ GUARDAR DATOS EN LOCALS
  =========================================
  
     Disponible en:
     
     ✔ +layout.server.ts
     ✔ +page.server.ts
     ✔ endpoints API
     ✔ toda la app SSR
  */
	event.locals.session = session;
	event.locals.user = user;
	event.locals.perfil = perfil;

	/* =========================================
     9️⃣ CONTINUAR REQUEST
  =========================================
  
     filterSerializedResponseHeaders:
     requerido por Supabase SSR
  */
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
