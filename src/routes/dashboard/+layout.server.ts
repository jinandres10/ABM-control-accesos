// src/routes/dashboard/+layout.server.ts

export const load = async ({ locals }) => {
	return {
		user: locals.user,
		perfil: locals.perfil
	};
};