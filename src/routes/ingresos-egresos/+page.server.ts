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
			.select(`
				*,
				perfiles!fk_ingreso_egreso_usuario (
					id,
					nombre,
					apellido
				)
			`)
			.order('creado_en', { ascending: false })
			.limit(1000);
	
	console.log('DATA:', JSON.stringify(ingresos?.[2], null, 2))
	
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
	console.log(
		JSON.stringify(
		ingresos?.[0],
		null,
		2
		)
	)
	return {
		ingresos: ingresos ?? [],
		edificios: edificios ?? []
	};
};