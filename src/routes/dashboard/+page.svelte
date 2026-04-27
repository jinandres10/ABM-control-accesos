<script lang="ts">
	import { resolve } from '$app/paths';

	// ✅ Svelte 5 props
	const { data } = $props<{
		data: {
			user: any;
			perfil: any;
		};
	}>();

	const esAdmin = $derived(data?.perfil?.rol === 'admin');
</script>

<div class="p-6 space-y-6">

	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold">
			Dashboard Control de Accesos
		</h1>

		<p class="text-sm text-gray-500">
			Bienvenido {data?.perfil?.nombre ?? data?.user?.email}
		</p>
	</div>

	<!-- Navegación principal -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">

		<a
			href={resolve('/edificios')}
			class="p-4 border rounded hover:shadow transition"
		>
			<h2 class="font-semibold text-lg">🏢 Edificios</h2>
			<p class="text-sm text-gray-500">
				Gestión completa de edificios
			</p>
		</a>



		{#if esAdmin}
			<a
				href={resolve('/admin/usuarios')}
				class="p-4 border rounded hover:shadow transition border-red-300"
			>
				<h2 class="font-semibold text-lg">🔐 Admin Usuarios</h2>
				<p class="text-sm text-gray-500">
					Alta, baja y gestión de usuarios
				</p>
			</a>
		{/if}

	</div>

</div>