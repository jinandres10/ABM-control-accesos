import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';

const supabaseAdmin = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { email, password, nombre } = body;

		if (!email || !password) {
			return json(
				{ error: 'Email y password requeridos' },
				{ status: 400 }
			);
		}

		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (error) {
			return json(
				{ error: error.message },
				{ status: 500 }
			);
		}

		// Crear perfil
		await supabaseAdmin.from('perfiles').insert({
		id: data.user.id,
		email,
		nombre,
		rol: 'usuario'
		});

		return json({ user: data.user });

	} catch (err) {
		return json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
};