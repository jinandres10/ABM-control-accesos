<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { invalidateAll } from '$app/navigation';
	import type { Edificio, EdificioForm } from '$lib/types';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';

	// ✅ Props tipadas
	const { data } = $props<{ data: PageData }>();

	/* =========================
	   ESTADOS
	========================= */

	let form = $state<EdificioForm>({
		nombre: '',
		latitud: '',
		longitud: '',
		direccion: ''
	});

	let editandoId = $state<string | null>(null);
	let error = $state('');
	let cargando = $state(false);
	let busqueda = $state('');
	let mostrarBajas = $state(false);

	/* =========================
	   DERIVED CORRECTO (🔥 CLAVE)
	========================= */

	let edificiosFiltrados = $derived.by(() => {

		const texto =
			busqueda.trim().toLowerCase();

		return data.edificios.filter((e) => {

			if (!mostrarBajas && !e.activo) {
				return false;
			}

			if (!texto) {
				return true;
			}

			return e.nombre
				.toLowerCase()
				.includes(texto);
		});
	});

	/* =========================
	   CRUD
	========================= */

	async function guardar(): Promise<void> {
		if (!form.nombre || !form.latitud || !form.longitud || !form.direccion) {
			error = 'Completá todos los campos';
			return;
		}

		cargando = true;
		error = '';

		const payload = {
			nombre: form.nombre,
			latitud: parseFloat(form.latitud),
			longitud: parseFloat(form.longitud),
			direccion: form.direccion
		};

		if (editandoId) {
			const { error: err } = await supabase
				.from('edificios')
				.update(payload)
				.eq('id', editandoId);

			if (err) error = err.message;
		} else {
			const { error: err } = await supabase
				.from('edificios')
				.insert(payload);

			if (err) error = err.message;
		}

		cargando = false;

		if (!error) {
			limpiar();
			await invalidateAll();
		}
	}

	function editar(e: Edificio): void {
		editandoId = e.id;

		form = {
			nombre: e.nombre,
			latitud: String(e.latitud),
			longitud: String(e.longitud),
			direccion: e.direccion
		};
	}

	async function eliminar(id: string): Promise<void> {
		if (browser && !confirm('¿Eliminar este edificio?')) return;

		const { error: err } = await supabase
			.from('edificios')
			.delete()
			.eq('id', id);

		if (err) {
			error = err.message;
			return;
		}

		await invalidateAll();
	}

	function limpiar(): void {
		editandoId = null;
		form = { nombre: '', latitud: '', longitud: '', direccion: '' };
		error = '';
	}

	function formatFecha(ts: string): string {
		return new Date(ts).toLocaleDateString('es-AR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

<div class="page">
	<h2>🏢 Edificios</h2>

	<!-- ================= FORM ================= -->

	<div class="form-card">
		<h3>{editandoId ? 'Editar Edificio' : 'Nuevo Edificio'}</h3>

		<div class="form-grid">
			<input bind:value={form.nombre} placeholder="Nombre del edificio" />
			<input bind:value={form.latitud} type="number" step="any" placeholder="Latitud" />
			<input bind:value={form.longitud} type="number" step="any" placeholder="Longitud" />
			<input bind:value={form.direccion} placeholder="Dirección" />
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<div class="form-actions">
			<button onclick={guardar} disabled={cargando}>
				{cargando ? 'Guardando...' : editandoId ? '💾 Actualizar' : '➕ Agregar'}
			</button>

			{#if editandoId}
				<button class="btn-secundario" onclick={limpiar}>
					Cancelar
				</button>
			{/if}
		</div>
	</div>

	<!-- ================= BUSCADOR ================= -->

	<div class="buscador">
		<input
			type="text"
			placeholder="🔍 Buscar edificio por nombre..."
			bind:value={busqueda}
		/>
	</div>

	<!-- ================= TABLA ================= -->

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Nombre</th>
					<th>Latitud</th>
					<th>Longitud</th>
					<th>QR</th>
					<th>Dirección</th>
					<th>Creado</th>
					<th>Acciones</th>
				</tr>
			</thead>

			<tbody>
				{#each edificiosFiltrados as e (e.id)}
					<tr class:editando={editandoId === e.id}>
						<td>{e.nombre}</td>
						<td>{e.latitud}</td>
						<td>{e.longitud}</td>

						<td>
							<img
								src={`https://quickchart.io/qr?size=120&text=${e.id}`}
								alt="QR"
								class="qr-img"
							/>

							<div class="qr-actions">
								<a
									href={`https://quickchart.io/qr?size=300&text=${e.id}`}
									target="_blank"
									download={`QR-${e.nombre}.png`}
								>
									⬇️ Descargar
								</a>
							</div>
						</td>

						<td>{e.direccion}</td>
						<td>{formatFecha(e.creado_en)}</td>

						<td class="acciones">
							<button class="btn-icono" onclick={() => editar(e)}>✏️</button>
							<button class="btn-icono danger" onclick={() => eliminar(e.id)}>🗑️</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="vacio">
							No hay edificios registrados
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.qr-img {
		border-radius: 8px;
		border: 1px solid #ddd;
		padding: 4px;
		background: white;
	}

	.qr-actions {
		margin-top: 6px;
		font-size: 12px;
		text-align: center;
	}

	.qr-actions a {
		color: #2563eb;
		text-decoration: none;
	}

	.qr-actions a:hover {
		text-decoration: underline;
	}

	.buscador {
		margin: 20px 0;
	}

	.buscador input {
		width: 100%;
		padding: 10px;
		border-radius: 8px;
		border: 1px solid #ddd;
		font-size: 14px;
	}

	.buscador input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
	}
</style>