import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const response = await locals.supabase
		.from('edificios')
		.select('*')
		.order('creado_en', { ascending: false });

	if (response.error) {
		console.error('Error cargando edificios:', response.error.message);

		return {
			edificios: []
		};
	}

	return {
		edificios: response.data ?? []
	};
};