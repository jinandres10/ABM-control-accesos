<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { Edificio, EdificioForm } from '$lib/types';
	import type { PageData } from './$types';

	const EMPTY_FORM: EdificioForm = { nombre: '', latitud: '', longitud: '', direccion: '' };
	let { data } = $props<{ data: PageData }>();

	let form = $state<EdificioForm>({ ...EMPTY_FORM });
	let editandoId = $state<string | null>(null);
	let mensaje = $state('');
	let error = $state('');
	let cargando = $state(false);
	let busqueda = $state('');
	let mostrarBajas = $state(false);

	const edificiosFiltrados = $derived.by(() => {
		const texto = busqueda.trim().toLocaleLowerCase('es-AR');
		return data.edificios.filter(
			(edificio: Edificio) =>
				(mostrarBajas || edificio.activo) &&
				(!texto || edificio.nombre.toLocaleLowerCase('es-AR').includes(texto))
		);
	});

	function validarFormulario(): boolean {
		const latitud = Number(form.latitud);
		const longitud = Number(form.longitud);
		if (!form.nombre.trim() || !form.direccion.trim()) {
			error = 'Completá el nombre y la dirección.';
			return false;
		}
		if (!Number.isFinite(latitud) || latitud < -90 || latitud > 90) {
			error = 'Ingresá una latitud válida entre -90 y 90.';
			return false;
		}
		if (!Number.isFinite(longitud) || longitud < -180 || longitud > 180) {
			error = 'Ingresá una longitud válida entre -180 y 180.';
			return false;
		}
		return true;
	}

	async function guardar(): Promise<void> {
		error = '';
		mensaje = '';
		if (!validarFormulario()) return;

		cargando = true;
		const payload = {
			nombre: form.nombre.trim(),
			latitud: Number(form.latitud),
			longitud: Number(form.longitud),
			direccion: form.direccion.trim()
		};
		const { error: requestError } = editandoId
			? await supabase.from('edificios').update(payload).eq('id', editandoId)
			: await supabase.from('edificios').insert({ ...payload, activo: true, fecha_baja: null });
		cargando = false;

		if (requestError) {
			error = requestError.message;
			return;
		}
		mensaje = editandoId ? 'Edificio actualizado correctamente.' : 'Edificio creado correctamente.';
		limpiar();
		await invalidateAll();
	}

	function editar(edificio: Edificio): void {
		editandoId = edificio.id;
		form = {
			nombre: edificio.nombre,
			latitud: String(edificio.latitud),
			longitud: String(edificio.longitud),
			direccion: edificio.direccion ?? ''
		};
		mensaje = '';
		error = '';
	}

	async function cambiarEstado(edificio: Edificio): Promise<void> {
		const activo = !edificio.activo;
		const accion = activo ? 'reactivar' : 'dar de baja';
		if (!confirm(`¿Confirmás ${accion} “${edificio.nombre}”?`)) return;
		const { error: requestError } = await supabase
			.from('edificios')
			.update({ activo, fecha_baja: activo ? null : new Date().toISOString() })
			.eq('id', edificio.id);
		if (requestError) {
			error = requestError.message;
			return;
		}
		mensaje = activo ? 'Edificio reactivado.' : 'Edificio dado de baja.';
		await invalidateAll();
	}

	function limpiar(): void {
		editandoId = null;
		form = { ...EMPTY_FORM };
		error = '';
	}

	function formatFecha(fecha: string): string {
		return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(fecha));
	}

	/** Genera la URL del QR a partir del identificador único del edificio. */
	function qrUrl(id: string, size: number): string {
		return `https://quickchart.io/qr?size=${size}&text=${encodeURIComponent(id)}`;
	}
</script>

<section class="page" aria-labelledby="titulo-edificios">
	<div class="page-heading">
		<div>
			<h1 id="titulo-edificios">Edificios</h1>
			<p>Administrá las ubicaciones habilitadas para registrar accesos.</p>
		</div>
	</div>

	<form
		class="form-card"
		onsubmit={(event) => {
			event.preventDefault();
			guardar();
		}}
	>
		<h2>{editandoId ? 'Editar edificio' : 'Nuevo edificio'}</h2>
		<div class="form-grid">
			<label
				>Nombre<input
					bind:value={form.nombre}
					required
					maxlength="120"
					autocomplete="organization"
				/></label
			>
			<label
				>Dirección<input
					bind:value={form.direccion}
					required
					maxlength="200"
					autocomplete="street-address"
				/></label
			>
			<label
				>Latitud<input
					bind:value={form.latitud}
					required
					type="number"
					step="any"
					min="-90"
					max="90"
					inputmode="decimal"
				/></label
			>
			<label
				>Longitud<input
					bind:value={form.longitud}
					required
					type="number"
					step="any"
					min="-180"
					max="180"
					inputmode="decimal"
				/></label
			>
		</div>
		{#if error}<p class="error" role="alert">{error}</p>{/if}
		{#if mensaje}<p class="success" role="status">{mensaje}</p>{/if}
		<div class="form-actions">
			<button class="btn-primario" type="submit" disabled={cargando}
				>{cargando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear edificio'}</button
			>
			{#if editandoId}<button class="btn-secundario" type="button" onclick={limpiar}
					>Cancelar</button
				>{/if}
		</div>
	</form>

	<div class="list-toolbar">
		<label class="search-label"
			>Buscar edificios<input
				bind:value={busqueda}
				type="search"
				placeholder="Nombre del edificio"
			/></label
		>
		<label class="checkbox-label"
			><input bind:checked={mostrarBajas} type="checkbox" /> Mostrar dados de baja</label
		>
	</div>

	<div class="table-wrap">
		<table>
			<thead
				><tr
					><th>Nombre</th><th>Dirección</th><th>Coordenadas</th><th>Código QR</th><th>Estado</th><th
						>Creado</th
					><th><span class="sr-only">Acciones</span></th></tr
				></thead
			>
			<tbody>
				{#each edificiosFiltrados as edificio (edificio.id)}
					<tr class:editando={editandoId === edificio.id}>
						<td>{edificio.nombre}</td><td>{edificio.direccion ?? '—'}</td><td
							>{edificio.latitud}, {edificio.longitud}</td
						>
						<td>
							<a
								href={qrUrl(edificio.id, 300)}
								target="_blank"
								rel="external noopener noreferrer"
								download={`QR-${edificio.nombre}.png`}
								aria-label={`Abrir o descargar el código QR de ${edificio.nombre}`}
							>
								<img
									class="qr-image"
									src={qrUrl(edificio.id, 120)}
									alt={`Código QR de ${edificio.nombre}`}
								/>
							</a>
						</td>
						<td
							><span
								class:badge-green={edificio.activo}
								class:badge-red={!edificio.activo}
								class="badge">{edificio.activo ? 'Activo' : 'Baja'}</span
							></td
						>
						<td>{formatFecha(edificio.creado_en)}</td>
						<td class="acciones"
							><button class="btn-secundario" type="button" onclick={() => editar(edificio)}
								>Editar</button
							><button class="btn-danger" type="button" onclick={() => cambiarEstado(edificio)}
								>{edificio.activo ? 'Dar de baja' : 'Reactivar'}</button
							></td
						>
					</tr>
				{:else}<tr><td class="vacio" colspan="7">No hay edificios para mostrar.</td></tr>{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	.page-heading,
	.list-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}
	label {
		color: var(--color-text);
		font-size: 0.9rem;
		font-weight: 600;
	}
	label input {
		margin-top: 0.35rem;
	}
	.search-label {
		width: min(100%, 28rem);
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
	}
	.checkbox-label input {
		margin: 0;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}
	.qr-image {
		display: block;
		width: 72px;
		height: 72px;
		padding: 0.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: #fff;
	}
	@media (max-width: 640px) {
		.acciones {
			min-width: 10rem;
			flex-wrap: wrap;
		}
	}
</style>
