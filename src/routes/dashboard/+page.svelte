<script lang="ts">
	/**
	 * =========================================
	 * DASHBOARD PRINCIPAL
	 * -----------------------------------------
	 * - Muestra opciones según rol
	 * - Usa datos protegidos desde layout.server
	 * - Aplica control de acceso por frontend
	 * - Navegación SPA moderna
	 * - Compatible con Svelte 5 runes
	 * =========================================
	 */

	import { goto } from '$app/navigation';
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
	const nombreUsuario = $derived(data?.perfil?.nombre ?? data?.user?.email ?? 'Usuario');

	/**
	 * =========================================
	 * RUTAS CENTRALIZADAS
	 * =========================================
	 * 🔥 as const mantiene literales exactos
	 * compatibles con typed routes
	 * =========================================
	 */

	const rutas = {
		edificios: '/edificios',
		ingresosEgresos: '/ingresos-egresos',
		adminUsuarios: '/admin/usuarios'
	} as const;

	/**
	 * =========================================
	 * TIPO DERIVADO DE RUTAS
	 * =========================================
	 */

	type RutaApp = (typeof rutas)[keyof typeof rutas];

	/**
	 * =========================================
	 * NAVEGACIÓN SPA
	 * =========================================
	 * ✔ Compatible con ESLint
	 * ✔ Compatible con typed routes
	 * ✔ Compatible con resolve()
	 * =========================================
	 */

	function irA(ruta: RutaApp) {
		goto(resolve(ruta));
	}
</script>

<div class="p-6 space-y-6">
	<!-- =========================
       HEADER
  ========================= -->
	<div>
		<h1 class="text-2xl font-bold">ADMINISTRACIÓN</h1>

		<p class="text-sm text-gray-500">
			Bienvenido {nombreUsuario}
		</p>
	</div>

	<!-- =========================
       NAVEGACIÓN PRINCIPAL
  ========================= -->

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<!-- =========================
         🏢 EDIFICIOS
    ========================= -->

		<button
			onclick={() => irA(rutas.edificios)}
			class="p-4 border rounded hover:shadow transition text-left"
		>
			<h2 class="font-semibold text-lg">🏢 Edificios</h2>

			<!--
      <p class="text-sm text-gray-500">
        Gestión completa de edificios
      </p>
      -->
		</button>

		<!-- =========================
         📍 PRESENCIAS
    ========================= -->

		<button
			onclick={() => irA(rutas.ingresosEgresos)}
			class="p-4 border rounded hover:shadow transition text-left"
		>
			<h2 class="font-semibold text-lg">📍 Presencias</h2>

			<!--
      <p class="text-sm text-gray-500">
        Registro de presencia en edificios
      </p>
      -->
		</button>

		<!-- =========================
         🔐 ADMIN USUARIOS
         SOLO ADMIN
    ========================= -->

		{#if esAdmin}
			<button
				onclick={() => irA(rutas.adminUsuarios)}
				class="p-4 border rounded hover:shadow transition border-red-300 text-left"
			>
				<h2 class="font-semibold text-lg">🔐 Usuarios</h2>

				<!--
        <p class="text-sm text-gray-500">
          Alta, baja y gestión de usuarios
        </p>
        -->
			</button>
		{/if}
	</div>
</div>
