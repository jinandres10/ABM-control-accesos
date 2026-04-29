// src/routes/dashboard/+layout.server.ts

// src/routes/dashboard/+layout.server.ts

import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {

	/* =============================
	   1️⃣ VALIDAR SESIÓN
	   =============================
	   Si no hay usuario autenticado → login
	*/
	if (!locals.user) {
		throw redirect(303, '/');
	}

	/* =============================
	   2️⃣ VALIDAR PERFIL
	   =============================
	   Seguridad adicional:
	   - evita usuarios sin perfil
	   - evita inconsistencias auth vs DB
	*/
	if (!locals.perfil) {
		throw redirect(303, '/');
	}

	/* =============================
	   3️⃣ VALIDAR BLOQUEO
	   =============================
	   Si el usuario está bloqueado,
	   no debe acceder al sistema
	*/
	if (locals.perfil.bloqueada) {
		throw redirect(303, '/');
	}

	/* =============================
	   4️⃣ RETORNAR DATA SEGURA
	*/
	return {
		user: locals.user,
		perfil: locals.perfil
	};
};