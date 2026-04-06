<script lang="ts">
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'

  let email: string = ''
  let password: string = ''
  let error: string = ''
  let cargando: boolean = false

  async function login(): Promise<void> {
    if (!email || !password) {
      error = 'Completá email y contraseña'
      return
    }
    cargando = true
    error = ''
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    cargando = false
    if (err) {
      error = err.message
    } else {
      goto('/edificios')
    }
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') login()
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
      on:keydown={handleKeydown}
      autocomplete="email"
    />
    <input
      bind:value={password}
      placeholder="Contraseña"
      type="password"
      on:keydown={handleKeydown}
      autocomplete="current-password"
    />

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button on:click={login} disabled={cargando}>
      {cargando ? 'Ingresando...' : 'Ingresar'}
    </button>
  </div>
</div>