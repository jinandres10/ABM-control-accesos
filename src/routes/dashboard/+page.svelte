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
  const nombreUsuario = $derived(
    data?.perfil?.nombre ??
    data?.user?.email ??
    'Usuario'
  );

  /* =========================
     NAVEGACIÓN (SPA CORRECTA)
  ========================= */

const rutas = {
  edificios: '/edificios',
  adminUsuarios: '/admin/usuarios'
} as const;

type RutaApp = typeof rutas[keyof typeof rutas];

function irA(ruta: RutaApp) {
  goto(resolve(ruta));
}

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
    <button
      onclick={() => irA('/edificios')}
      class="p-4 border rounded hover:shadow transition text-left"
    >
      <h2 class="font-semibold text-lg">🏢 Edificios</h2>
      <p class="text-sm text-gray-500">
        Gestión completa de edificios
      </p>
    </button>

    <!-- 🔐 ADMIN (solo admin) -->
    {#if esAdmin}
      <button
        onclick={() => irA('/admin/usuarios')}
        class="p-4 border rounded hover:shadow transition border-red-300 text-left"
      >
        <h2 class="font-semibold text-lg">🔐 Admin Usuarios</h2>
        <p class="text-sm text-gray-500">
          Alta, baja y gestión de usuarios
        </p>
      </button>
    {/if}

  </div>

</div>
