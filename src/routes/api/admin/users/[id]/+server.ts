import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import {
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY
} from '$env/static/private'

/* =========================================
   🔐 CLIENTE ADMIN (bypass RLS)
========================================= */

const supabaseAdmin = createClient(
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY
)

/* =========================================
   ✏️ UPDATE USER
========================================= */

export const PUT: RequestHandler = async ({
	params,
	request,
	locals
}) => {

	/* =========================
	   VALIDAR ADMIN
	========================= */

	if (locals.perfil?.rol !== 'admin') {
		return json(
			{ error: 'No autorizado' },
			{ status: 403 }
		)
	}

	const { id } = params

	if (!id) {
		return json(
			{ error: 'ID requerido' },
			{ status: 400 }
		)
	}

	/* =========================
	   BODY
	========================= */

	const body = await request.json()

	/* =========================
	   OBJETO UPDATE DINÁMICO
	========================= */

	const updateData: Record<string, any> = {}

	// 👤 Datos personales
	if (body.nombre !== undefined)
		updateData.nombre = body.nombre

	if (body.apellido !== undefined)
		updateData.apellido = body.apellido

	if (body.telefono !== undefined)
		updateData.telefono = body.telefono

	// 🔐 Rol
	if (body.rol !== undefined)
		updateData.rol = body.rol

	// 🔓 Desbloqueo
	if (body.bloqueada !== undefined)
		updateData.bloqueada = body.bloqueada

	if (body.intentos_fallidos !== undefined)
		updateData.intentos_fallidos =
			body.intentos_fallidos

	/* =========================
	   VALIDAR UPDATE VACÍO
	========================= */

	if (Object.keys(updateData).length === 0) {
		return json(
			{ error: 'Nada para actualizar' },
			{ status: 400 }
		)
	}

	/* =========================
	   UPDATE PERFIL
	========================= */

	const { error } = await supabaseAdmin
		.from('perfiles')
		.update(updateData)
		.eq('id', id)

	if (error) {
		return json(
			{ error: error.message },
			{ status: 500 }
		)
	}

	return json({ ok: true })
}

/* =========================================
   🗑️ DELETE USER
========================================= */

export const DELETE: RequestHandler = async ({
	params,
	locals
}) => {

	/* =========================
	   VALIDAR ADMIN
	========================= */

	if (locals.perfil?.rol !== 'admin') {
		return json(
			{ error: 'No autorizado' },
			{ status: 403 }
		)
	}

	const { id } = params

	if (!id) {
		return json(
			{ error: 'ID requerido' },
			{ status: 400 }
		)
	}

	try {

		/* =========================
		   1️⃣ ELIMINAR AUTH USER
		========================= */

		const { error: authError } =
			await supabaseAdmin.auth.admin.deleteUser(id)

		if (authError) {
			return json(
				{ error: authError.message },
				{ status: 500 }
			)
		}

		/* =========================
		   2️⃣ ELIMINAR PERFIL
		========================= */

		const { error: perfilError } =
			await supabaseAdmin
				.from('perfiles')
				.delete()
				.eq('id', id)

		if (perfilError) {
			return json(
				{ error: perfilError.message },
				{ status: 500 }
			)
		}

		return json({ ok: true })

	} catch (err) {

		console.error(err)

		return json(
			{ error: 'Error interno' },
			{ status: 500 }
		)
	}
}

/* =========================================
   🔑 RESET PASSWORD
========================================= */

export const PATCH: RequestHandler = async ({
	params,
	request,
	locals
}) => {

	/* =========================
	   VALIDAR ADMIN
	========================= */

	if (locals.perfil?.rol !== 'admin') {
		return json(
			{ error: 'No autorizado' },
			{ status: 403 }
		)
	}

	const { id } = params

	if (!id) {
		return json(
			{ error: 'ID requerido' },
			{ status: 400 }
		)
	}

	/* =========================
	   BODY
	========================= */

	const { password } = await request.json()

	if (!password) {
		return json(
			{ error: 'Password requerida' },
			{ status: 400 }
		)
	}

	/* =========================
	   UPDATE PASSWORD
	========================= */

		const result =
		await supabaseAdmin.auth.admin.updateUserById(id, {
			password
		})

		console.log('UPDATE PASSWORD RESULT:')
		console.dir(result, { depth: null })

		if (result.error) {
		console.error('PASSWORD ERROR:')
		console.error(result.error)

		return json(
			{ error: result.error.message },
			{ status: 500 }
		)
		}

		console.log('PASSWORD UPDATED OK')

	return json({ ok: true })
}