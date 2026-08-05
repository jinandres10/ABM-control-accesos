import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MAX_DISTANCE_METERS = 20_000;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const toRadians = (value: number) => (value * Math.PI) / 180;
	const earthRadius = 6_371_000;
	const deltaLat = toRadians(lat2 - lat1);
	const deltaLng = toRadians(lng2 - lng1);
	const a =
		Math.sin(deltaLat / 2) ** 2 +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;
	return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const GET: RequestHandler = async ({ locals }) => {
	if (locals.perfil?.rol !== 'admin') return json({ error: 'No autorizado' }, { status: 403 });
	const { data, error } = await locals.supabase
		.from('ingreso_egreso')
		.select('*')
		.order('creado_en', { ascending: false })
		.limit(100);
	return error ? json({ error: 'Error obteniendo registros' }, { status: 500 }) : json({ data });
};

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	if (!locals.user) return json({ error: 'No autenticado' }, { status: 401 });
	let body: { id_edificio?: unknown; geo_usuario_lat?: unknown; geo_usuario_lng?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'El cuerpo debe ser JSON válido' }, { status: 400 });
	}

	const idEdificio = typeof body.id_edificio === 'string' ? body.id_edificio : '';
	const latitudUsuario = Number(body.geo_usuario_lat);
	const longitudUsuario = Number(body.geo_usuario_lng);
	if (
		!idEdificio ||
		!Number.isFinite(latitudUsuario) ||
		!Number.isFinite(longitudUsuario) ||
		Math.abs(latitudUsuario) > 90 ||
		Math.abs(longitudUsuario) > 180
	) {
		return json({ error: 'Ubicación o edificio inválidos' }, { status: 400 });
	}

	const { data: edificio, error: edificioError } = await locals.supabase
		.from('edificios')
		.select('id, nombre, latitud, longitud, activo')
		.eq('id', idEdificio)
		.maybeSingle();
	if (edificioError || !edificio?.activo)
		return json({ error: 'Edificio no encontrado o inactivo' }, { status: 404 });

	const distancia = haversineDistance(
		latitudUsuario,
		longitudUsuario,
		edificio.latitud,
		edificio.longitud
	);
	if (distancia > MAX_DISTANCE_METERS)
		return json({ error: 'La ubicación está demasiado alejada del edificio' }, { status: 422 });

	const now = new Date();
	const { error } = await locals.supabase.from('ingreso_egreso').insert({
		id_usuario: locals.user.id,
		usuario: locals.user.email ?? '',
		id_edificio: edificio.id,
		nombre_edificio: edificio.nombre,
		geo_usuario_lat: latitudUsuario,
		geo_usuario_lng: longitudUsuario,
		geo_edificio_lat: edificio.latitud,
		geo_edificio_lng: edificio.longitud,
		fecha: now.toISOString().slice(0, 10),
		hora: now.getHours(),
		minutos: now.getMinutes(),
		segundos: now.getSeconds(),
		distancia_metros: Math.round(distancia),
		gps_disponible: true,
		device_name: 'web',
		os: 'web',
		browser: request.headers.get('user-agent') ?? getClientAddress(),
		online_status: true,
		fue_offline: false
	});
	return error ? json({ error: 'Error guardando registro' }, { status: 500 }) : json({ ok: true });
};
