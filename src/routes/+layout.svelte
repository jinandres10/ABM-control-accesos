<script lang="ts">
  import { goto } from '$app/navigation'
  import { supabase } from '$lib/supabase'
  import type { LayoutData } from './$types'
  import '../app.css'

  export let data: LayoutData

  async function cerrarSesion(): Promise<void> {
    await supabase.auth.signOut()
    goto('/login')
  }
</script>

{#if data.session}
  <nav class="navbar">
    <span class="brand">🔐 Control de Accesos</span>
    <div class="nav-links">
      <a href="/edificios">🏢 Edificios</a>
      <a href="/perfiles">👤 Perfiles</a>
      <button on:click={cerrarSesion}>Salir</button>
    </div>
  </nav>
{/if}

<main class="container">
  <slot />
</main>
