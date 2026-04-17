import { json } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import type { RequestHandler } from './$types'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private'

// ✅ Cliente ADMIN (backend)
const supabaseAdmin = createClient(
	SUPABASE_URL,
	SUPABASE_ANON_KEY
)



// ✅ GET → listar usuarios
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

// ✅ POST → crear usuario
export const POST: RequestHandler = async ({ request }) => {
	const { email, password, nombre, rol } = await request.json()

	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password,
		email_confirm: true
	})

	if (error) {
		return json({ error: error.message }, { status: 500 })
	}

	await supabaseAdmin.from('perfiles').insert({
		id: data.user.id,
		email,
		nombre,
		rol: rol ?? 'usuario'
	})

	return json({ ok: true })
}

// ✅ DELETE → eliminar usuario
export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json()

	const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

	if (error) {
		return json({ error: error.message }, { status: 500 })
	}

	return json({ ok: true })
}