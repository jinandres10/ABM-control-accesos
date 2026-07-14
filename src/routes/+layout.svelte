<script lang="ts">
  /**
   * =====================================================
   * LAYOUT GLOBAL
   * -----------------------------------------------------
   * - Maneja UI global (navbar, logout)
   * - Sincroniza estado de autenticación
   * - Reacciona a login/logout automáticamente
   * =====================================================
   */

  import '../app.css';
  import { logout } from '$lib/auth';

  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  let { children } = $props();

  /* =========================================
     🔄 ESCUCHAR CAMBIOS DE AUTH (MUY IMPORTANTE)
     ========================================= */
  onMount(() => {
    const { data: listener } =
      supabase.auth.onAuthStateChange(() => {

        // 🔄 Fuerza actualización de toda la app
        // (session, user, layout.ts, etc.)
        invalidateAll();
      });

    return () => {
      listener?.subscription.unsubscribe();
    };
  });
</script>

<!-- =========================================
     HEADER GLOBAL
========================================= -->
<header class="header">

  <div class="brand">
    Panel administrativo del control de accesos
  </div>

  <!-- BOTÓN LOGOUT -->
  <button class="logout-btn" onclick={logout}>
    🔒 Cerrar sesión
  </button>

</header>


<!-- =========================================
     CONTENIDO PRINCIPAL
========================================= -->
<main class="container page">
  {@render children()}
</main>