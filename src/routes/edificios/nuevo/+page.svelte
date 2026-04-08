<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	/* =========================
	   STATE (Svelte 5 Runes)
	========================= */

	let nombre = $state('');
	let direccion = $state('');
	let latitud = $state('');
	let longitud = $state('');
	let estado = $state('activo');
	let foto = $state('');

	let guardando = $state(false);
	let errorMsg = $state('');

	/* =========================
	   INSERT
	========================= */

	async function guardar() {
		errorMsg = '';
		guardando = true;

		const { error } = await supabase
			.from('edificios')
			.insert({
				nombre,
				direccion,
				latitud,
				longitud,
				estado,
				foto: foto || null
			});

		guardando = false;

		if (error) {
			errorMsg = error.message;
			return;
		}

		goto(resolve('/edificios'));
	}
</script>

<div class="p-6 space-y-3 max-w-md">

	<h1 class="text-xl font-bold">
		Nuevo edificio
	</h1>

	<input
		bind:value={nombre}
		placeholder="Nombre"
		class="border p-2 w-full"
	/>

	<input
		bind:value={direccion}
		placeholder="Dirección"
		class="border p-2 w-full"
	/>

	<input
		bind:value={latitud}
		placeholder="Latitud"
		class="border p-2 w-full"
	/>

	<input
		bind:value={longitud}
		placeholder="Longitud"
		class="border p-2 w-full"
	/>

	<!-- Estado -->
	<select
		bind:value={estado}
		class="border p-2 w-full"
	>
		<option value="activo">Activo</option>
		<option value="inactivo">Inactivo</option>
	</select>

	<!-- Foto -->
	<input
		bind:value={foto}
		placeholder="URL Foto (opcional)"
		class="border p-2 w-full"
	/>

	{#if foto}
		<img
			src={foto}
			alt="Preview"
			class="rounded shadow max-h-48 object-cover"
		/>
	{/if}

	{#if errorMsg}
		<p class="text-red-600 text-sm">
			{errorMsg}
		</p>
	{/if}

	<button
		class="bg-blue-600 text-white p-2 rounded w-full disabled:opacity-50"
		onclick={guardar}
		disabled={guardando}
	>
		{guardando ? 'Guardando...' : 'Guardar'}
	</button>

</div>