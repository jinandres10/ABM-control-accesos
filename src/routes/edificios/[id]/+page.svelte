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
				longitud: edificio.longitud
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
	<div class="flex flex-col gap-2 max-w-md">

		<input
			class="border p-2"
			placeholder="Nombre"
			bind:value={edificio.nombre}
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

		<button
			class="bg-blue-600 text-white p-2 rounded"
			onclick={actualizar}
		>
			Actualizar
		</button>

	</div>
{/if}