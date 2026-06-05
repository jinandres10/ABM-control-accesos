<script lang="ts">
	import type { PageData } from './$types';
	import type { IngresoEgreso } from '$lib/types';
	import * as XLSX from 'xlsx'

	/**
	 * =========================================
	 * PROPS SSR
	 * =========================================
	 */

	const { data } = $props<{ data: PageData }>();
	console.log('DATA PAGE:', data);
	console.log('INGRESOS:', data?.ingresos);
	/**
	 * =========================================
	 * FILTROS
	 * =========================================
	 */

	let filtroUsuario = $state('');
	let filtroEdificio = $state('');
	
	const hoy = new Date();
	const fechaHoy =
	`${String(hoy.getDate()).padStart(2, '0')}/` +
	`${String(hoy.getMonth() + 1).padStart(2, '0')}/` +
	`${hoy.getFullYear()}`;

	let filtroFecha = $state(fechaHoy);

	/**
	 * =========================================
	 * NORMALIZAR FECHA DD/MM/YYYY
	 * =========================================
	 */

	function normalizarFecha(fecha: string): string {

		const d = new Date(fecha);

		const dia = String(d.getDate()).padStart(2, '0');
		const mes = String(d.getMonth() + 1).padStart(2, '0');
		const anio = d.getFullYear();

		return `${dia}/${mes}/${anio}`;
	}

	/**
	 * =========================================
	 * FORMATO FECHA Y HORA
	 * =========================================
	 */

	function formatFecha(ts: string): string {

		return new Date(ts).toLocaleString('es-AR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	/**
	 * =========================================
	 * Exportado a Excel
	 * =========================================
	 */
		function exportarExcel() {

	const datos = ingresosFiltrados.map((i) => ({

		/* =========================
		   IDENTIFICACIÓN
		========================= */

		ID: i.id,

		ID_USUARIO: i.id_usuario,

		USUARIO: i.usuario,

		NOMBRE: i.perfiles?.nombre ?? '',

		APELLIDO: i.perfiles?.apellido ?? '',

		/* =========================
		   EDIFICIO
		========================= */

		ID_EDIFICIO: i.id_edificio,

		NOMBRE_EDIFICIO: i.nombre_edificio,

		GEO_EDIFICIO_LAT: i.geo_edificio_lat,

		GEO_EDIFICIO_LNG: i.geo_edificio_lng,

		/* =========================
		   GEO USUARIO
		========================= */

		GEO_USUARIO_LAT: i.geo_usuario_lat,

		GEO_USUARIO_LNG: i.geo_usuario_lng,

		DISTANCIA_METROS:
			i.distancia_metros,

		/* =========================
		   FECHA Y HORA
		========================= */

		FECHA: i.fecha,

		HORA: i.hora,

		MINUTOS: i.minutos,

		SEGUNDOS: i.segundos,

		CREADO_EN: formatFecha(
			i.creado_en
		),

		TIMESTAMP_CLIENTE:
			i.timestampcliente,

		/* =========================
		   ESTADO
		========================= */

		FUE_OFFLINE:
			i.fue_offline
				? 'SI'
				: 'NO',

		ONLINE_STATUS:
			i.online_status
				? 'SI'
				: 'NO',

		GPS_DISPONIBLE:
			i.gps_disponible
				? 'SI'
				: 'NO',

		/* =========================
		   DISPOSITIVO
		========================= */

		DEVICE_NAME:
			i.device_name,

		OS:
			i.os,

		BROWSER:
			i.browser,

		USER_AGENT:
			i.user_agent
	}))

	const worksheet =
		XLSX.utils.json_to_sheet(datos)

	const workbook =
		XLSX.utils.book_new()

	XLSX.utils.book_append_sheet(
		workbook,
		worksheet,
		'RegistroPresencia'
	)

	/* =========================
	   AJUSTAR ANCHO COLUMNAS
	========================= */

	worksheet['!cols'] = [
		{ wch: 10 }, // ID
		{ wch: 38 }, // ID_USUARIO
		{ wch: 25 }, // USUARIO
		{ wch: 20 }, // NOMBRE
		{ wch: 20 }, // APELLIDO
		{ wch: 38 }, // ID_EDIFICIO
		{ wch: 30 }, // EDIFICIO
		{ wch: 15 },
		{ wch: 15 },
		{ wch: 15 },
		{ wch: 15 },
		{ wch: 18 },
		{ wch: 12 },
		{ wch: 8 },
		{ wch: 8 },
		{ wch: 8 },
		{ wch: 22 },
		{ wch: 22 },
		{ wch: 12 },
		{ wch: 12 },
		{ wch: 12 },
		{ wch: 25 },
		{ wch: 20 },
		{ wch: 20 },
		{ wch: 60 } // USER_AGENT
	]

	const fecha =
		new Date()
			.toISOString()
			.substring(0, 10)

	XLSX.writeFile(
		workbook,
		`registro_presencia_${fecha}.xlsx`
	)
}

	/**
	 * =========================================
	 * LISTADO FILTRADO + ORDENADO
	 * =========================================
	 * - Más reciente → más antiguo
	 * - Filtro usuario
	 * - Filtro edificio
	 * - Filtro fecha DD/MM/YYYY
	 * =========================================
	 */


	const ingresosFiltrados = $derived(

	[...(data.ingresos ?? [])]

		.sort((a: IngresoEgreso, b: IngresoEgreso) =>
			new Date(b.creado_en).getTime() -
			new Date(a.creado_en).getTime()
		)

		.filter((i: IngresoEgreso) => {

			const textoBusqueda =
				filtroUsuario.trim().toLowerCase();

			const cumpleUsuario =
				!textoBusqueda ||

				i.usuario?.toLowerCase().includes(textoBusqueda) ||

				i.perfiles?.nombre
					?.toLowerCase()
					.includes(textoBusqueda) ||

				i.perfiles?.apellido
					?.toLowerCase()
					.includes(textoBusqueda) ||

				`${i.perfiles?.nombre ?? ''} ${i.perfiles?.apellido ?? ''}`
					.toLowerCase()
					.includes(textoBusqueda);

			const cumpleEdificio =
				!filtroEdificio ||
				i.nombre_edificio
					?.toLowerCase()
					.includes(
						filtroEdificio.toLowerCase()
					);

			const fechaRegistro =
				normalizarFecha(i.creado_en);

			const cumpleFecha =
				!filtroFecha ||
				fechaRegistro.includes(filtroFecha);

			return (
				cumpleUsuario &&
				cumpleEdificio &&
				cumpleFecha
			);
		})

	);
</script>

<div class="page">

	<h1>📍 Registro de Presencia</h1>

	<!-- =============================
	     FILTROS
	============================= -->

	<div class="filtros">

		<input
			type="text"
			placeholder="👤 Filtrar por usuario"
			bind:value={filtroUsuario}
		/>

		<input
			type="text"
			placeholder="🏢 Filtrar por edificio"
			bind:value={filtroEdificio}
		/>
		

		<input
			type="text"
			placeholder="📅 Filtrar fecha (dd/mm/yyyy)"
			bind:value={filtroFecha}
		/>

	</div>
	<div class="acciones">

		<button
			class="btn-exportar"
			onclick={exportarExcel}
		>
			📊 Exportar Excel
		</button>

	</div>
	<!-- =============================
	     TABLA
	============================= -->

	<div class="table-wrap">

		<table>

			<thead>
				<tr>
					<th>Usuario</th>
					<th>Nombre</th>
					<th>Apellido</th>
					<th>Edificio</th>
					<th>Fecha</th>
					<th>Distancia</th>
					<th>GPS</th>
					<th>Online</th>
				</tr>
			</thead>

			<tbody>

				{#each ingresosFiltrados as i (i.id)}

					<tr>

						<td>{i.usuario}</td>

						<td>{i.perfiles?.nombre ?? '-'}</td>

						<td>{i.perfiles?.apellido ?? '-'}</td>

						<td>{i.nombre_edificio}</td>

						<td>{formatFecha(i.creado_en)}</td>

						<td>
							{Math.round(i.distancia_metros ?? 0)} m
						</td>

						<td>
							{i.gps_disponible ? '✅' : '❌'}
						</td>

						<td>
							{i.online_status ? '🟢' : '🔴'}
						</td>

					</tr>

				{:else}

					<tr>
						<td colspan="8" class="vacio">
							No hay registros encontrados
						</td>
					</tr>

				{/each}

			</tbody>

		</table>

	</div>

</div>

<style>

	/* =========================================
	   FILTROS
	========================================= */

	.filtros {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 12px;
		margin: 20px 0;
	}

	.filtros input {
		padding: 10px;
		border-radius: 8px;
		border: 1px solid #d1d5db;
		font-size: 14px;
	}

	.filtros input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
	}

	/* =========================================
	   TABLA
	========================================= */

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 12px;
		border-bottom: 1px solid #e5e7eb;
		text-align: left;
	}

	th {
		background: #f9fafb;
		font-weight: 600;
	}

	.vacio {
		text-align: center;
		padding: 20px;
		color: #6b7280;
	}

	.acciones {
		margin-bottom: 15px;
	}

	.btn-exportar {
		background: #16a34a;
		color: white;
		border: none;
		padding: 10px 16px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
	}

	.btn-exportar:hover {
		background: #15803d;
	}
</style>