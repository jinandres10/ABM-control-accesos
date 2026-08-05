import type { PageServerLoad } from './$types';

/**
 * =========================================
 * LOAD SSR
 * -----------------------------------------
 * - Carga ingresos
 * - Carga perfiles
 * - JOIN manual (✅ robusto)
 * - Carga edificios
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
       2️⃣ OBTENER INGRESOS (SIN JOIN)
    ============================= */
	const { data: ingresosRaw, error: errorIngresos } = await locals.supabase
		.from('ingreso_egreso')
		.select('*')
		.order('creado_en', { ascending: false })
		.limit(10000);

	if (errorIngresos) {
		console.error('Error ingresos:', errorIngresos);
	}

	/* =============================
       3️⃣ OBTENER PERFILES
    ============================= */
	const { data: perfiles, error: errorPerfiles } = await locals.supabase
		.from('perfiles')
		.select('id, nombre, apellido, doc');

	if (errorPerfiles) {
		console.error('Error perfiles:', errorPerfiles);
	}

	/**
	 * =========================================
	 * 4️⃣ INDEXAR PERFILES (🔥 PERFORMANCE PRO)
	 * -----------------------------------------
	 * Convertimos array → Map
	 * lookup O(1) en vez de O(n)
	 * =========================================
	 */
	const perfilesMap = new Map((perfiles ?? []).map((p) => [p.id.trim().toLowerCase(), p]));

	/**
	 * =========================================
	 * 5️⃣ JOIN MANUAL (🔥 CLAVE)
	 * -----------------------------------------
	 * - evita problemas de FK/relaciones
	 * - completamente controlado
	 * - siempre devuelve datos consistentes
	 * =========================================
	 */
	const ingresos = (ingresosRaw ?? []).map((i: any) => {
		const perfil = perfilesMap.get(i.id_usuario?.trim().toLowerCase()) ?? null;

		return {
			...i,

			/**
			 * ✅ SIEMPRE objeto o null
			 * (nunca array, nunca inconsistente)
			 */
			perfiles: perfil
		};
	});

	/* =============================
       DEBUG (opcional)
       console.log(ingresos[0].perfiles);
    ============================= */

	/* =============================
       6️⃣ OBTENER EDIFICIOS
    ============================= */
	const { data: edificios, error: errorEdificios } = await locals.supabase
		.from('edificios')
		.select('*')
		.order('nombre');

	if (errorEdificios) {
		console.error('Error edificios:', errorEdificios);
	}

	/* =============================
       7️⃣ RETURN FINAL
    ============================= */
	return {
		ingresos,
		edificios: edificios ?? []
	};
};
