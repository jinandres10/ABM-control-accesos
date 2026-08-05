import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';

import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/* =========================================
   🔐 CLIENTE ADMIN
   -----------------------------------------
   Service Role:
   ✔ bypass RLS
   ✔ CRUD completo
========================================= */

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* =========================================
   📥 GET → LISTAR USUARIOS
=========================================

   Por defecto:
   ✔ Solo usuarios activos

   Opcional:
   ✔ incluirBajas=true

   Ejemplos:

   /api/admin/users

   /api/admin/users?incluirBajas=true

========================================= */

export const GET: RequestHandler = async ({ url, locals }) => {
	if (locals.perfil?.rol !== 'admin') {
		return json({ error: 'No autorizado' }, { status: 403 });
	}

	const incluirBajas = url.searchParams.get('incluirBajas') === 'true';

	let query = supabaseAdmin.from('perfiles').select('*');

	/**
	 * Mostrar únicamente usuarios activos
	 */
	if (!incluirBajas) {
		query = query.eq('activo', true);
	}

	const { data, error } = await query.order('creado_en', {
		ascending: false
	});

	if (error) {
		return json(
			{
				error: error.message
			},
			{
				status: 500
			}
		);
	}

	return json({
		usuarios: data
	});
};

/* =========================================
   ➕ POST → CREAR USUARIO
========================================= */

export const POST: RequestHandler = async ({ request, locals }) => {
	/* =========================
	   VALIDAR ADMIN
	========================= */

	if (locals.perfil?.rol !== 'admin') {
		return json(
			{
				error: 'No autorizado'
			},
			{
				status: 403
			}
		);
	}

	/* =========================
	   BODY
	========================= */

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'El cuerpo debe ser JSON válido' }, { status: 400 });
	}

	const { email, password, nombre, apellido, telefono, doc, rol } = body;

	/* =========================
	   VALIDACIONES
	========================= */

	if (
		typeof email !== 'string' ||
		typeof password !== 'string' ||
		!email.trim() ||
		password.length < 6
	) {
		return json(
			{
				error: 'Email y password requeridos'
			},
			{
				status: 400
			}
		);
	}

	if (
		doc !== undefined &&
		doc !== null &&
		(!Number.isInteger(Number(doc)) || String(doc).length > 8)
	) {
		return json(
			{
				error: 'El documento debe ser numérico y tener hasta 8 dígitos.'
			},
			{
				status: 400
			}
		);
	}

	try {
		/* =========================
		   1️⃣ CREAR AUTH USER
		========================= */

		const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email: email.trim().toLowerCase(),
			password,

			/**
			 * Evita necesidad
			 * de confirmar email
			 */
			email_confirm: true
		});

		if (authError) {
			return json(
				{
					error: authError.message
				},
				{
					status: 500
				}
			);
		}

		if (!data.user) {
			return json(
				{
					error: 'No se pudo crear el usuario'
				},
				{
					status: 500
				}
			);
		}

		/* =========================
		   2️⃣ CREAR PERFIL
		========================= */

		const { error: perfilError } = await supabaseAdmin.from('perfiles').insert({
			/* =====================
				   RELACIÓN AUTH
				===================== */

			id: data.user.id,

			/* =====================
				   DATOS PERSONALES
				===================== */

			email: email.trim().toLowerCase(),
			nombre: typeof nombre === 'string' ? nombre.trim() : '',
			apellido: typeof apellido === 'string' ? apellido.trim() : '',
			telefono: typeof telefono === 'string' ? telefono.trim() : '',
			doc: doc ?? null,

			/* =====================
				   SEGURIDAD
				===================== */

			rol: rol === 'admin' || rol === 'operador' || rol === 'viewer' ? rol : 'viewer',

			intentos_fallidos: 0,
			bloqueada: false,

			/* =====================
				   BAJA LÓGICA
				===================== */

			activo: true,
			fecha_baja: null
		});

		if (perfilError) {
			/**
			 * Si falla el insert
			 * sería ideal eliminar
			 * también el auth user
			 * para evitar huérfanos.
			 */

			await supabaseAdmin.auth.admin.deleteUser(data.user.id);
			return json(
				{
					error: perfilError.message
				},
				{
					status: 500
				}
			);
		}

		return json({
			ok: true
		});
	} catch (err) {
		console.error(err);

		return json(
			{
				error: 'Error interno'
			},
			{
				status: 500
			}
		);
	}
};
