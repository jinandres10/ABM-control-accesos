<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  // ✅ estados reactivos (Svelte 5 runes)
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let cargando = $state(false);

  // ✅ login
  async function login(): Promise<void> {
    if (!email || !password) {
      error = 'Completá email y contraseña';
      return;
    }

    cargando = true;
    error = '';

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    cargando = false;

    if (err) {
      error = err.message;
    } else {
      goto(resolve('/dashboard'));
    }
  }

  // ✅ FIX ESLINT: tipar evento desde el DOM
  function handleKeydown(e: globalThis.KeyboardEvent): void {
    if (e.key === 'Enter') {
      login();
    }
  }
</script>

<div class="login-wrap">
  <div class="login-card">
    <h1>Control de Accesos</h1>
    <p class="subtitle">Ingresá tus credenciales para continuar</p>

    <input
      bind:value={email}
      placeholder="Email"
      type="email"
      onkeydown={handleKeydown}
      autocomplete="email"
    />

    <input
      bind:value={password}
      placeholder="Contraseña"
      type="password"
      onkeydown={handleKeydown}
      autocomplete="current-password"
    />

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button onclick={login} disabled={cargando}>
      {cargando ? 'Ingresando...' : 'Ingresar'}
    </button>
  </div>
</div>