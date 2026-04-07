<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<nav class="navbar">
  <div class="brand">Control Accesos</div>
</nav>

<main class="container page">
  {@render children()}
</main>