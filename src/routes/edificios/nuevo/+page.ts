import { redirect } from '@sveltejs/kit';

// El alta se realiza en la pantalla unificada de edificios para evitar contratos duplicados.
export const load = () => redirect(303, '/edificios');
