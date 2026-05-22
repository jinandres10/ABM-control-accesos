import { json } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import type { RequestHandler } from './$types'

import {
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY
} from '$env/static/private'

/* =========================================
   🔐 CLIENTE ADMIN
========================================= */

const supabaseAdmin = createClient(
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY
)

/* =========================================
   📥 GET → LISTAR USUARIOS
========================================= */

export const GET: RequestHandler = async () => {

	const { data, error } = await supabaseAdmin
		.from('perfiles')
		.select('*')
		.order('creado_en', {
			ascending: false
		})

	if (error) {
		return json(
			{ error: error.message },
			{ status: 500 }
		)
	}

	return json({
		usuarios: data
	})
}

/* =========================================
   ➕ POST → CREAR USUARIO
========================================= */

export const POST: RequestHandler = async ({
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

	/* =========================
	   BODY
	========================= */

	const {
		email,
		password,
		nombre,
		apellido,
		telefono,
		rol
	} = await request.json()

	/* =========================
	   VALIDACIONES
	========================= */

	if (!email || !password) {
		return json(
			{
				error:
					'Email y password requeridos'
			},
			{ status: 400 }
		)
	}

	try {

		/* =========================
		   1️⃣ CREAR AUTH USER
		========================= */

		const {
			data,
			error: authError
		} =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password,
				email_confirm: true
			})

		if (authError) {
			return json(
				{ error: authError.message },
				{ status: 500 }
			)
		}

		if (!data.user) {
			return json(
				{
					error:
						'No se pudo crear el usuario'
				},
				{ status: 500 }
			)
		}

		/* =========================
		   2️⃣ CREAR PERFIL
		========================= */

		const {
			error: perfilError
		} = await supabaseAdmin
			.from('perfiles')
			.insert({

				/* =====================
				   RELACIÓN AUTH
				===================== */

				id: data.user.id,

				/* =====================
				   DATOS USUARIO
				===================== */

				email,
				nombre: nombre ?? '',
				apellido: apellido ?? '',
				telefono: telefono ?? '',

				/* =====================
				   SEGURIDAD
				===================== */

				rol: rol ?? 'viewer',

				intentos_fallidos: 0,

				bloqueada: false
			})

		if (perfilError) {
			return json(
				{
					error:
						perfilError.message
				},
				{ status: 500 }
			)
		}

		return json({
			ok: true
		})

	} catch (err) {

		console.error(err)

		return json(
			{ error: 'Error interno' },
			{ status: 500 }
		)
	}
}