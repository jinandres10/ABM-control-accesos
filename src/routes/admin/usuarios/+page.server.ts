import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/admin/users');
	const data = await res.json();

	return {
		usuarios: data.usuarios ?? []
	};
};
