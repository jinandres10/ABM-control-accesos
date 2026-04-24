import { json } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import type { RequestHandler } from './$types'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

// 🔐 CLIENTE ADMIN REAL
const supabaseAdmin = createClient(
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY
)


console.log('URL:', SUPABASE_URL)
console.log('SERVICE KEY:', SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20))


/* =========================
   GET → listar usuarios
========================= */
export const GET: RequestHandler = async () => {

	const { data, error } = await supabaseAdmin
		.from('perfiles')
		.select('*')
		.order('creado_en', { ascending: false })

	if (error) {
		return json({ error: error.message }, { status: 500 })
	}

	return json({ usuarios: data })
}



/* =========================
   POST → crear usuario
========================= */
export const POST: RequestHandler = async ({ request, locals }) => {

	// 🔐 validar admin
	if (locals.perfil?.rol !== 'admin') {
		return json({ error: 'No autorizado' }, { status: 403 })
	}

	const { email, password, nombre, rol } = await request.json()

	if (!email || !password) {
		return json({ error: 'Email y password requeridos' }, { status: 400 })
	}

	try {

		// 🔥 1. crear usuario auth
		const { data, error: authError } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password,
				email_confirm: true
			})

		console.log('AUTH ERROR:', authError)
		console.log('AUTH DATA:', data)

		if (authError) {
			return json({ error: authError.message }, { status: 500 })
		}

		// 🔥 2. crear perfil
		const { error: perfilError } = await supabaseAdmin
			.from('perfiles')
			.insert({
				id: data.user.id,
				email,
				nombre,
				rol: rol ?? 'viewer'
			})
		console.log('PERFIL ERROR:', perfilError)
		
		if (perfilError) {
			return json({ error: perfilError.message }, { status: 500 })
		}

		return json({ ok: true })

	} catch {
		return json({ error: 'Error interno' }, { status: 500 })
	}
}