<script>
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let nombre = $state('');
	let latitud = $state('');
	let longitud = $state('');

	async function guardar() {
		await supabase.from('edificios').insert({
			nombre,
			latitud,
			longitud
		});

		goto(resolve('/edificios'));
	}
</script>

<div class="p-6 space-y-2">
<input bind:value={nombre} placeholder="Nombre" class="border p-2"/>
<input bind:value={latitud} placeholder="Latitud" class="border p-2"/>
<input bind:value={longitud} placeholder="Longitud" class="border p-2"/>

<button class="bg-blue-600 text-white p-2" onclick={guardar}>
Guardar
</button>
</div>