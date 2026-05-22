import type { PageServerLoad } from './$types';

/**
 * =========================================
 * LOAD SSR
 * -----------------------------------------
 * - Carga ingresos/egresos
 * - Carga edificios
 * - Se ejecuta en servidor
 * =========================================
 */
export const load: PageServerLoad = async ({ locals }) => {

	/* =============================
	   1️⃣ VALIDAR LOGIN
	============================= */

	if (!locals.user) {
		return {
			ingresos: [],
			edificios: []
		};
	}

	/* =============================
	   2️⃣ OBTENER INGRESOS
	============================= */

	const { data: ingresos, error } =
		await locals.supabase
			.from('ingreso_egreso')
			.select('*')
			.order('creado_en', { ascending: false })
			.limit(1000); // ✅ agregado

	if (error) {
		console.error(error);
	}

	/* =============================
	   3️⃣ OBTENER EDIFICIOS
	============================= */

	const { data: edificios } =
		await locals.supabase
			.from('edificios')
			.select('*')
			.order('nombre');

	/* =============================
	   4️⃣ RETURN
	============================= */

	return {
		ingresos: ingresos ?? [],
		edificios: edificios ?? []
	};
};