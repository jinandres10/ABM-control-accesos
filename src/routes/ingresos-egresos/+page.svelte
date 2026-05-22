<script lang="ts">
	import type { PageData } from './$types';

	/**
	 * =========================================
	 * PROPS SSR
	 * =========================================
	 */

	const { data } = $props<{ data: PageData }>();

	/**
	 * =========================================
	 * FILTROS
	 * =========================================
	 */

	let filtroUsuario = $state('');
	let filtroEdificio = $state('');
	let filtroFecha = $state('');

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
	 * LISTADO FILTRADO + ORDENADO
	 * =========================================
	 * - Más reciente → más antiguo
	 * - Filtro usuario
	 * - Filtro edificio
	 * - Filtro fecha DD/MM/YYYY
	 * =========================================
	 */

	const ingresosFiltrados = $derived(

		[...data.ingresos]

			.sort((a: any, b: any) =>
				new Date(b.creado_en).getTime() -
				new Date(a.creado_en).getTime()
			)

			.filter((i: any) => {

				/* =========================
				   FILTRO USUARIO
				========================= */

				const cumpleUsuario =
					!filtroUsuario ||
					i.usuario
						?.toLowerCase()
						.includes(
							filtroUsuario.toLowerCase()
						);

				/* =========================
				   FILTRO EDIFICIO
				========================= */

				const cumpleEdificio =
					!filtroEdificio ||
					i.nombre_edificio
						?.toLowerCase()
						.includes(
							filtroEdificio.toLowerCase()
						);

				/* =========================
				   FILTRO FECHA
				========================= */

				const fechaRegistro =
					normalizarFecha(i.creado_en);

				const cumpleFecha =
					!filtroFecha ||
					fechaRegistro.includes(
						filtroFecha
					);

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

	<!-- =============================
	     TABLA
	============================= -->

	<div class="table-wrap">

		<table>

			<thead>
				<tr>
					<th>Usuario</th>
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
						<td colspan="6" class="vacio">
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

</style>