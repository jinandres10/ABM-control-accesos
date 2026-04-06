<script>
	import { supabase } from '$lib/supabase';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let edificio;

	onMount(async () => {
		const { data } = await supabase
			.from('edificios')
			.select('*')
			.eq('id', page.params.id)
			.single();

		edificio = data;
	});

	async function actualizar() {
		await supabase
			.from('edificios')
			.update(edificio)
			.eq('id', edificio.id);

		goto('/edificios');
	}
</script>

{#if edificio}
<input bind:value={edificio.nombre}/>
<input bind:value={edificio.latitud}/>
<input bind:value={edificio.longitud}/>

<button on:click={actualizar}>Actualizar</button>
{/if}