import { redirect } from '@sveltejs/kit';

// La edición vive en el listado principal y usa el mismo modelo de datos que el alta.
export const load = () => redirect(303, '/edificios');
