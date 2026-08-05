import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/* =========================================
   🔐 CLIENTE ADMIN (BYPASS RLS)
   -----------------------------------------
   Se utiliza exclusivamente en backend.

   Permite:
   ✔ CRUD perfiles
   ✔ Reset password
   ✔ Gestión de usuarios
========================================= */

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* =========================================
   ✏️ UPDATE USER
========================================= */

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	/* =========================
	   VALIDAR ADMIN
	========================= */

	if (locals.perfil?.rol !== 'admin') {
		return json({ error: 'No autorizado' }, { status: 403 });
	}

	const { id } = params;

	if (!id) {
		return json({ error: 'ID requerido' }, { status: 400 });
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

	/* =========================
	   OBJETO UPDATE DINÁMICO
	========================= */

	const updateData: Record<string, unknown> = {};

	/* =========================
	   DATOS PERSONALES
	========================= */

	if (body.nombre !== undefined) updateData.nombre = body.nombre;

	if (body.apellido !== undefined) updateData.apellido = body.apellido;

	if (body.telefono !== undefined) updateData.telefono = body.telefono;

	if (body.doc !== undefined) updateData.doc = body.doc;
	/* =========================
	   ROL
	========================= */

	if (body.rol !== undefined) {
		if (body.rol !== 'admin' && body.rol !== 'operador' && body.rol !== 'viewer') {
			return json({ error: 'Rol inválido' }, { status: 400 });
		}
		updateData.rol = body.rol;
	}

	/* =========================
	   BLOQUEO / DESBLOQUEO
	========================= */

	if (body.bloqueada !== undefined) updateData.bloqueada = body.bloqueada;

	if (body.intentos_fallidos !== undefined) updateData.intentos_fallidos = body.intentos_fallidos;

	/* =========================
	   BAJA LÓGICA / REACTIVACIÓN
	========================= */

	if (body.activo !== undefined) {
		updateData.activo = body.activo;

		/**
		 * Usuario dado de baja
		 */
		if (body.activo === false) {
			updateData.fecha_baja = new Date().toISOString();
		}

		/**
		 * Usuario reactivado
		 */
		if (body.activo === true) {
			updateData.fecha_baja = null;
		}
	}

	/* =========================
	   VALIDAR UPDATE VACÍO
	========================= */

	if (Object.keys(updateData).length === 0) {
		return json({ error: 'Nada para actualizar' }, { status: 400 });
	}

	if (
		body.doc !== undefined &&
		body.doc !== null &&
		(!Number.isInteger(Number(body.doc)) || String(body.doc).length > 10)
	) {
		return json(
			{
				error: 'El documento debe ser numérico y tener hasta 10 dígitos.'
			},
			{
				status: 400
			}
		);
	}
	/* =========================
	   UPDATE PERFIL
	========================= */

	const { error } = await supabaseAdmin.from('perfiles').update(updateData).eq('id', id);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({
		ok: true,
		message: 'Usuario actualizado'
	});
};

/* =========================================
   🚫 BAJA LÓGICA
   -----------------------------------------
   NO elimina usuario.

   Actualiza:
   activo = false
   fecha_baja = now()

   Conserva:
   ✔ historial
   ✔ ingresos/egresos
   ✔ auditoría
========================================= */

export const DELETE: RequestHandler = async ({ params, locals }) => {
	/* =========================
	   VALIDAR ADMIN
	========================= */

	if (locals.perfil?.rol !== 'admin') {
		return json({ error: 'No autorizado' }, { status: 403 });
	}

	const { id } = params;

	if (!id) {
		return json({ error: 'ID requerido' }, { status: 400 });
	}

	const { error } = await supabaseAdmin
		.from('perfiles')
		.update({
			activo: false,
			fecha_baja: new Date().toISOString()
		})
		.eq('id', id);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({
		ok: true,
		message: 'Usuario dado de baja'
	});
};

/* =========================================
   🔑 RESET PASSWORD
========================================= */

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	/* =========================
	   VALIDAR ADMIN
	========================= */

	if (locals.perfil?.rol !== 'admin') {
		return json({ error: 'No autorizado' }, { status: 403 });
	}

	const { id } = params;

	if (!id) {
		return json({ error: 'ID requerido' }, { status: 400 });
	}

	/* =========================
	   BODY
	========================= */

	let password: unknown;
	try {
		({ password } = await request.json());
	} catch {
		return json({ error: 'El cuerpo debe ser JSON válido' }, { status: 400 });
	}

	if (typeof password !== 'string' || password.length < 6) {
		return json({ error: 'Password requerida' }, { status: 400 });
	}

	/* =========================
	   UPDATE PASSWORD
	========================= */

	const result = await supabaseAdmin.auth.admin.updateUserById(id, {
		password
	});

	if (result.error) {
		console.error('PASSWORD ERROR:', result.error);

		return json({ error: result.error.message }, { status: 500 });
	}

	return json({
		ok: true,
		message: 'Contraseña actualizada'
	});
};
