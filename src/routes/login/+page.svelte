<script lang="ts">
  /**
   * =========================================
   * LOGIN SVELTE 5 (RUNES)
   * -----------------------------------------
   * - Llama a /api/login (validación + seguridad)
   * - Si OK → crea sesión real con Supabase
   * - Maneja errores y estados de carga
   * =========================================
   */

  import { supabase } from '$lib/supabase';
  /*import { goto } from '$app/navigation';*/
  import { resolve } from '$app/paths';

  /* =========================
     STATE (Svelte 5 runes)
  ========================== */
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let cargando = $state(false);

  /* =========================
     LOGIN PRINCIPAL
  ========================== */
  async function login(): Promise<void> {

    // 🔹 Validación básica frontend
    if (!email || !password) {
      error = 'Completá email y contraseña';
      return;
    }

    cargando = true;
    error = '';




    try {

      /* =============================
         1️⃣ LOGIN UNIFICADO (BACKEND)
         - valida usuario
         - controla bloqueos
         - maneja intentos fallidos
      ============================== */
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      // ❌ Error de negocio (bloqueado, inválido, etc.)
      if (data.error) {
        error = data.error;
        return;
      }


    /* =============================
    2️⃣ CREAR SESIÓN REAL (CLIENTE)
    ⚠️ Esto crea:
    - access_token
    - refresh_token
    - localStorage
    - persistencia auth
    ============================== */
      const { error: err } = 
      await supabase.auth.signInWithPassword({
        email,
        password
      });

      /**
       * ❌ Error creando sesión
       */
      if (err) {
        error = 'Error creando sesión';
        cargando = false;
        return;
      }

    /* =============================
   3️⃣ ESPERAR PERSISTENCIA
   ⚠️ MUY IMPORTANTE
    ============================== */
     await new Promise((resolve) =>
     setTimeout(resolve, 500)
     );

    /* =============================
   4️⃣ REDIRECCIÓN
    ============================== */
    window.location.href = resolve('/dashboard');
    } catch (err) {

      console.error('ERROR LOGIN:', err);
      error = 'Error inesperado en el login';

    } finally {
      cargando = false;
    }
  }

  /* =========================
     UX: ENTER PARA LOGIN
  ========================== */
  function handleKeydown(e: globalThis.KeyboardEvent): void {
    if (e.key === 'Enter') {
      login();
    }
  }
</script>

<!-- =========================
     UI LOGIN
========================= -->
<div class="login-wrap">
  <div class="login-card">

    <h1>Control de Accesos</h1>
    <p class="subtitle">Ingresá tus credenciales para continuar</p>

    <!-- EMAIL -->
    <input
      bind:value={email}
      placeholder="Email"
      type="email"
      onkeydown={handleKeydown}
      autocomplete="email"
    />

    <!-- PASSWORD -->
    <input
      bind:value={password}
      placeholder="Contraseña"
      type="password"
      onkeydown={handleKeydown}
      autocomplete="current-password"
    />

    <!-- ERROR -->
    {#if error}
      <p class="error">{error}</p>
    {/if}

    <!-- BOTÓN -->
    <button onclick={login} disabled={cargando}>
      {cargando ? 'Ingresando...' : 'Ingresar'}
    </button>

  </div>
</div>