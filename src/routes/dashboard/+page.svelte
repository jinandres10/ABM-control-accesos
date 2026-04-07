<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<h1 class="text-2xl font-bold p-4">
  Dashboard Control Accesos
</h1>

<div class="p-4 space-x-4">
  <a
    href={resolve('/edificios')}
    class="text-blue-600"
  >
    Edificios
  </a>

  <a
    href={resolve('/perfiles')}
    class="text-blue-600"
  >
    Perfiles
  </a>
</div>