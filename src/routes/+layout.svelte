<script lang="ts">
  import '../app.css';
  import { logout } from '$lib/auth';
  let { children } = $props();
  
</script>


<header>
  <button onclick={logout}>
    Cerrar sesión
  </button>
</header>



<nav class="navbar">
  <div class="brand">Control Accesos</div>
</nav>

<main class="container page">
  {@render children()}
</main>