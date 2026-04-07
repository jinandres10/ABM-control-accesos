<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { invalidateAll } from '$app/navigation';
  import type { Perfil, PerfilForm } from '$lib/types';
  import type { PageData } from './$types';

  // ✅ props Svelte 5
  const { data } = $props<{ data: PageData }>();

  // ✅ estados reactivos
  let form = $state<PerfilForm>({
    nombre: '',
    email: ''
  });

  let editandoId = $state<string | null>(null);
  let error = $state('');
  let cargando = $state(false);

  // ------------------
  async function guardar(): Promise<void> {
    if (!form.nombre || !form.email) {
      error = 'Completá nombre y email';
      return;
    }

    cargando = true;
    error = '';

    const payload = {
      nombre: form.nombre,
      email: form.email
    };

    if (editandoId) {
      const { error: err } = await supabase
        .from('perfiles')
        .update(payload)
        .eq('id', editandoId);

      if (err) error = err.message;
    } else {
      const { error: err } = await supabase
        .from('perfiles')
        .insert(payload);

      if (err) error = err.message;
    }

    cargando = false;

    if (!error) {
      limpiar();
      await invalidateAll();
    }
  }

  function editar(p: Perfil): void {
    editandoId = p.id;
    form = {
      nombre: p.nombre ?? '',
      email: p.email ?? ''
    };
  }

  async function eliminar(id: string): Promise<void> {
    if (!window.confirm('¿Eliminar este perfil?')) return;

    const { error: err } = await supabase
      .from('perfiles')
      .delete()
      .eq('id', id);

    if (err) {
      error = err.message;
      return;
    }

    await invalidateAll();
  }

  function limpiar(): void {
    editandoId = null;
    form = { nombre: '', email: '' };
    error = '';
  }

  function formatFecha(ts: string): string {
    return new Date(ts).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
</script>

<div class="page">
  <h2>👤 Perfiles</h2>

  <div class="form-card">
    <h3>{editandoId ? 'Editar Perfil' : 'Nuevo Perfil'}</h3>

    <div class="form-grid">
      <input bind:value={form.nombre} placeholder="Nombre completo" />
      <input bind:value={form.email} placeholder="Email" type="email" />
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <div class="form-actions">
      <!-- ✅ Svelte 5 -->
      <button onclick={guardar} disabled={cargando}>
        {cargando
          ? 'Guardando...'
          : editandoId
          ? '💾 Actualizar'
          : '➕ Agregar'}
      </button>

      {#if editandoId}
        <button class="btn-secundario" onclick={limpiar}>
          Cancelar
        </button>
      {/if}
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Creado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {#each data.perfiles as p (p.id)}
          <tr class:editando={editandoId === p.id}>
            <td>{p.nombre ?? '—'}</td>
            <td>{p.email ?? '—'}</td>
            <td>{formatFecha(p.creado_en)}</td>

            <td class="acciones">
              <button
                class="btn-icono"
                onclick={() => editar(p)}
                title="Editar"
              >
                ✏️
              </button>

              <button
                class="btn-icono danger"
                onclick={() => eliminar(p.id)}
                title="Eliminar"
              >
                🗑️
              </button>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="4" class="vacio">
              No hay perfiles registrados
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>