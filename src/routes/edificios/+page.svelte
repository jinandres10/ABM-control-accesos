<script lang="ts">
  import { supabase } from '$lib/supabase'
  import { invalidateAll } from '$app/navigation'
  import type { Edificio, EdificioForm } from '$lib/types'
  import type { PageData } from './$types'

  export let data: PageData

  let form: EdificioForm = { nombre: '', latitud: '', longitud: '' }
  let editandoId: string | null = null
  let error: string = ''
  let cargando: boolean = false

  async function guardar(): Promise<void> {
    if (!form.nombre || !form.latitud || !form.longitud) {
      error = 'Completá todos los campos'
      return
    }
    cargando = true
    error = ''

    const payload = {
      nombre: form.nombre,
      latitud: parseFloat(form.latitud),
      longitud: parseFloat(form.longitud)
    }

    if (editandoId) {
      const { error: err } = await supabase
        .from('edificios')
        .update(payload)
        .eq('id', editandoId)
      if (err) error = err.message
    } else {
      const { error: err } = await supabase.from('edificios').insert(payload)
      if (err) error = err.message
    }

    cargando = false
    if (!error) {
      limpiar()
      await invalidateAll()
    }
  }

  function editar(e: Edificio): void {
    editandoId = e.id
    form = {
      nombre: e.nombre,
      latitud: String(e.latitud),
      longitud: String(e.longitud)
    }
  }

  async function eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar este edificio?')) return
    const { error: err } = await supabase.from('edificios').delete().eq('id', id)
    if (err) { error = err.message; return }
    await invalidateAll()
  }

  function limpiar(): void {
    editandoId = null
    form = { nombre: '', latitud: '', longitud: '' }
    error = ''
  }

  function formatFecha(ts: string): string {
    return new Date(ts).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }
</script>

<div class="page">
  <h2>🏢 Edificios</h2>

  <div class="form-card">
    <h3>{editandoId ? 'Editar Edificio' : 'Nuevo Edificio'}</h3>
    <div class="form-grid">
      <input bind:value={form.nombre} placeholder="Nombre del edificio" />
      <input bind:value={form.latitud} placeholder="Latitud" type="number" step="any" />
      <input bind:value={form.longitud} placeholder="Longitud" type="number" step="any" />
    </div>
    {#if error}<p class="error">{error}</p>{/if}
    <div class="form-actions">
      <button on:click={guardar} disabled={cargando}>
        {cargando ? 'Guardando...' : editandoId ? '💾 Actualizar' : '➕ Agregar'}
      </button>
      {#if editandoId}
        <button class="btn-secundario" on:click={limpiar}>Cancelar</button>
      {/if}
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Latitud</th>
          <th>Longitud</th>
          <th>Creado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each data.edificios as e (e.id)}
          <tr class:editando={editandoId === e.id}>
            <td>{e.nombre}</td>
            <td>{e.latitud}</td>
            <td>{e.longitud}</td>
            <td>{formatFecha(e.creado_en)}</td>
            <td class="acciones">
              <button class="btn-icono" on:click={() => editar(e)} title="Editar">✏️</button>
              <button class="btn-icono danger" on:click={() => eliminar(e.id)} title="Eliminar">🗑️</button>
            </td>
          </tr>
        {:else}
          <tr><td colspan="5" class="vacio">No hay edificios registrados</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>