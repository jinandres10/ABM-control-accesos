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

      // 🔎 1. validar estado (bloqueado, existe, etc.)
      const check = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const checkData = await check.json();

      if (checkData.error) {
        cargando = false;
        error = checkData.error;
        return;
      }

      // 🔐 2. login REAL (este crea la sesión en el browser)
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password
  });

  // ❌ fallo → sumar intento
  if (err) {
    await fetch('/api/login/fail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    cargando = false;
    error = 'Credenciales incorrectas';
    return;
  }

  // ✅ login OK → resetear intentos
  await fetch('/api/login/success', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  cargando = false;

  goto(resolve('/dashboard'));
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