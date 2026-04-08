<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	/* =========================
	   TYPES
	========================= */

	type Edificio = {
		id: number;
		nombre: string;
		latitud: string;
		longitud: string;
		direccion: string | null;
		estado: string | null;
		foto: string | null;
		ediqr: string | null;
	};

	/* =========================
	   PROPS (Svelte 5)
	========================= */

	const { params } = $props<{ params: { id: string } }>();

	/* =========================
	   STATE (Runes)
	========================= */

	let edificio = $state<Edificio | null>(null);
	let cargando = $state(true);

	/* =========================
	   LOAD DATA
	========================= */

	onMount(async () => {
		const { data, error } = await supabase
			.from('edificios')
			.select('*')
			.eq('id', Number(params.id))
			.single();

		if (!error && data) {
			edificio = data;
		}

		cargando = false;
	});

	/* =========================
	   UPDATE
	========================= */

	async function actualizar() {
		if (!edificio) return;

		const { error } = await supabase
			.from('edificios')
			.update({
				nombre: edificio.nombre,
				latitud: edificio.latitud,
				longitud: edificio.longitud,
				direccion: edificio.direccion,
				estado: edificio.estado,
				foto: edificio.foto
			})
			.eq('id', edificio.id);

		if (!error) {
			goto(resolve('/edificios'));
		}
	}
</script>

{#if cargando}
	<p>Cargando...</p>

{:else if edificio}
	<div class="flex flex-col gap-3 max-w-md">

		<h1 class="text-xl font-bold">Editar edificio</h1>

		<input
			class="border p-2"
			placeholder="Nombre"
			bind:value={edificio.nombre}
		/>

		<input
			class="border p-2"
			placeholder="Dirección"
			bind:value={edificio.direccion}
		/>

		<input
			class="border p-2"
			placeholder="Latitud"
			bind:value={edificio.latitud}
		/>

		<input
			class="border p-2"
			placeholder="Longitud"
			bind:value={edificio.longitud}
		/>

		<!-- Estado -->
		<select
			class="border p-2"
			bind:value={edificio.estado}
		>
			<option value="activo">Activo</option>
			<option value="inactivo">Inactivo</option>
		</select>

		<!-- URL Foto -->
		<input
			class="border p-2"
			placeholder="URL Foto"
			bind:value={edificio.foto}
		/>

		{#if edificio.foto}
			<img
				src={edificio.foto}
				alt="Foto edificio"
				class="rounded shadow max-h-48 object-cover"
			/>
		{/if}

		<!-- QR generado -->
		{#if edificio.ediqr}
			<div class="flex flex-col items-center gap-2 mt-4">
				<p class="font-semibold">QR del edificio</p>

				<img
					src={edificio.ediqr}
					alt="QR edificio"
					class="w-40 h-40 border rounded"
				/>

				<small class="text-gray-500">
					Generado automáticamente
				</small>
			</div>
		{/if}

		<button
			class="bg-blue-600 text-white p-2 rounded mt-4"
			onclick={actualizar}
		>
			Actualizar
		</button>

	</div>
{/if}