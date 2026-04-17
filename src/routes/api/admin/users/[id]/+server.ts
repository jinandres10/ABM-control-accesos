import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
// ✅ IMPORT CORRECTO DE VARIABLES (SvelteKit)
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

// 🔐 Cliente ADMIN (usa SERVICE ROLE KEY)
const supabaseAdmin = createClient(
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY
)

console.log('URL:', SUPABASE_URL)
console.log('KEY:', SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20))
/**
 * ✅ UPDATE de usuario (perfil)
 * Permite modificar:
 * - nombre
 * - rol
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {

	/**
	 * 📥 1. Obtener datos del body
	 */
	const { nombre, rol } = await request.json()

	const rolesValidos = ['admin', 'operador', 'viewer']


	/**
	 * ⚠️ Validación básica
	 */
	if (!params.id) {
		return json({ error: 'ID requerido' }, { status: 400 })
	}

	if (!rol) {
		return json({ error: 'Rol requerido' }, { status: 400 })
	}

	if (!rolesValidos.includes(rol)) {
		return json({ error: 'Rol inválido' }, { status: 400 })
	}

	/**
	 * 🔐 2. Seguridad (MUY IMPORTANTE)
	 * Solo admin puede modificar usuarios
	 */
	if (locals.perfil?.rol !== 'admin') {
		return json({ error: 'No autorizado' }, { status: 403 })
	}

	/**
	 * 🗄️ 3. Update en tabla perfiles
	 */
	const { error } = await locals.supabase
		.from('perfiles')
		.update({
			nombre,
			rol
		})
		.eq('id', params.id)

	/**
	 * ❌ Manejo de error
	 */
	if (error) {
		return json({ error: error.message }, { status: 500 })
	}

	/**
	 * ✅ OK
	 */
	return json({ ok: true })
	
}





// ✅ DELETE USUARIO REAL (Auth + perfiles)
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const userId = params.id

		if (!userId) {
			return json({ error: 'ID requerido' }, { status: 400 })
		}

		// 🔥 1. ELIMINAR USUARIO DE AUTH (LO MÁS IMPORTANTE)
		const { error: authError } =
			await supabaseAdmin.auth.admin.deleteUser(userId)

		if (authError) {
			return json({ error: authError.message }, { status: 500 })
		}

		// 🔥 2. ELIMINAR PERFIL (opcional pero recomendado)
		const { error: perfilError } = await supabaseAdmin
			.from('perfiles')
			.delete()
			.eq('id', userId)

		if (perfilError) {
			return json({ error: perfilError.message }, { status: 500 })
		}

		return json({ ok: true })

	} catch (err) {
		return json({ error: 'Error interno' }, { status: 500 })
	}
}