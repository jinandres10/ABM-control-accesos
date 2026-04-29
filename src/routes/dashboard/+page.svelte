<script lang="ts">
	/**
	 * =========================================
	 * DASHBOARD PRINCIPAL
	 * -----------------------------------------
	 * - Muestra opciones según rol
	 * - Usa datos protegidos desde layout.server
	 * - Aplica control de acceso por frontend
	 * =========================================
	 */

	import { resolve } from '$app/paths';

	/* =========================
	   PROPS (Svelte 5)
	========================= */
	const { data } = $props<{
		data: {
			user: any;
			perfil: any;
		};
	}>();

	/* =========================
	   DERIVED STATE
	========================= */

	// 🔐 Validación de rol administrador
	const esAdmin = $derived(data?.perfil?.rol === 'admin');

	// 👤 Nombre a mostrar (fallback seguro)
	const nombreUsuario = $derived(
		data?.perfil?.nombre ?? data?.user?.email ?? 'Usuario'
	);
</script>

<div class="p-6 space-y-6">

	<!-- =========================
	     HEADER
	========================= -->
	<div>
		<h1 class="text-2xl font-bold">
			Dashboard Control de Accesos
		</h1>

		<p class="text-sm text-gray-500">
			Bienvenido {nombreUsuario}
		</p>
	</div>

	<!-- =========================
	     NAVEGACIÓN PRINCIPAL
	========================= -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">

		<!-- 🏢 EDIFICIOS -->
		<a
			href={resolve('/edificios')}
			class="p-4 border rounded hover:shadow transition"
		>
			<h2 class="font-semibold text-lg">🏢 Edificios</h2>
			<p class="text-sm text-gray-500">
				Gestión completa de edificios
			</p>
		</a>

		<!-- 🔐 ADMIN (solo admin) -->
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