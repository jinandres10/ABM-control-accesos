<script lang="ts">
 // import { base } from '$app/paths'
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabase'
  import { resolve } from '$app/paths'
  //import type { RouteId } from '$app/types';

  interface StatCard {
    icono: string
    label: string
    valor: string
    sub: string
    id: string
  }

  interface NavCard {
    id: string
    icono: string
    titulo: string
    descripcion: string
      href:
    | "/"
    | "/dashboard"
    | "/edificios"
    | "/edificios/nuevo"
    | "/login"
    | "/perfiles";
    acento: string
    colorLink: string
  }

  interface Actividad {
    id: string
    iniciales: string
    nombre: string
    detalle: string
    tiempo: string
    color: 'blue' | 'green' | 'amber'
  }

  // Stats reactivas — se actualizan con los datos de Supabase
	let stats = $state<StatCard[]>([
	  { id: 'edificios', icono: '🏢', label: 'Edificios registrados', valor: '—', sub: 'Cargando...' },
	  { id: 'perfiles',  icono: '👤', label: 'Perfiles activos',      valor: '—', sub: 'Cargando...' },
 	 { id: 'accesos',   icono: '🔐', label: 'Accesos hoy',           valor: '—', sub: 'Sin datos aún' }
	])

  // ✅ hrefs como literales con base — soluciona el error eslint/no-navigation-without-resolve
const navCards: NavCard[] = [
  {
    id: 'edificios',
    icono: '🏢',
    titulo: 'Edificios',
    descripcion:
      'Gestioná los edificios del sistema: alta, modificación y baja.',
    href: '/edificios',
    acento: 'acento-blue',
    colorLink: '#2563eb'
  },
  {
    id: 'perfiles',
    icono: '👤',
    titulo: 'Perfiles',
    descripcion:
      'Administrá los perfiles de usuarios con acceso al sistema.',
    href: '/perfiles',
    acento: 'acento-violet',
    colorLink: '#7c3aed'
  }
]

	let actividad = $state<Actividad[]>([])
	let cargando = $state(true)
	let errorMsg = $state('')

  onMount(async () => {
    await cargarDatos()
  })

  async function cargarDatos(): Promise<void> {
    cargando = true
    errorMsg = ''

    try {
      // Contar edificios
      const { count: totalEdificios, error: errEd } = await supabase
        .from('edificios')
        .select('*', { count: 'exact', head: true })

      if (errEd) throw errEd

      // Contar perfiles
      const { count: totalPerfiles, error: errPer } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })

      if (errPer) throw errPer

      // Últimos 3 edificios modificados para la actividad reciente
      const { data: ultimos, error: errUlt } = await supabase
        .from('edificios')
        .select('id, nombre, creado_en')
        .order('creado_en', { ascending: false })
        .limit(3)

      if (errUlt) throw errUlt

      // Actualizar stats (inmutable para mantener reactividad)
      stats = [
        {
          id: 'edificios',
          icono: '🏢',
          label: 'Edificios registrados',
          valor: String(totalEdificios ?? 0),
          sub: totalEdificios === 1 ? '1 edificio cargado' : `${totalEdificios ?? 0} edificios cargados`,
        },
        {
          id: 'perfiles',
          icono: '👤',
          label: 'Perfiles activos',
          valor: String(totalPerfiles ?? 0),
          sub: totalPerfiles === 1 ? '1 perfil registrado' : `${totalPerfiles ?? 0} perfiles registrados`,
        },
        {
          id: 'accesos',
          icono: '🔐',
          label: 'Accesos hoy',
          valor: '—',
          sub: 'Módulo próximamente',
        },
      ]

      // Construir actividad reciente desde edificios
      const colores: Array<'blue' | 'green' | 'amber'> = ['blue', 'green', 'amber']
      actividad = (ultimos ?? []).map((e, i) => ({
        id: e.id,
        iniciales: e.nombre.slice(0, 2).toUpperCase(),
        nombre: e.nombre,
        detalle: 'Edificio registrado',
        tiempo: formatTiempo(e.creado_en),
        color: colores[i % colores.length],
      }))

    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Error al cargar los datos'
    } finally {
      cargando = false
    }
  }

  function formatTiempo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime()
    const min  = Math.floor(diff / 60000)
    const hs   = Math.floor(diff / 3600000)
    const dias = Math.floor(diff / 86400000)
    if (min < 1)   return 'ahora mismo'
    if (min < 60)  return `hace ${min} min`
    if (hs  < 24)  return `hace ${hs} h`
    return `hace ${dias} día${dias !== 1 ? 's' : ''}`
  }

  function fechaHoy(): string {
    return new Date().toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }
</script>

<!-- ───────────────────── TEMPLATE ───────────────────── -->
<div class="dash">

  <!-- Encabezado -->
  <header class="header">
    <div>
      <h1 class="titulo">Dashboard Control de Accesos</h1>
      <p class="subtitulo">Bienvenido — {fechaHoy()}</p>
    </div>
    <span class="badge-live">
      <span class="dot" aria-hidden="true"></span>
      Sistema activo
    </span>
  </header>

  <!-- Error global -->
  {#if errorMsg}
    <div class="error" role="alert">
      ⚠️ {errorMsg}
      <button class="btn-reintentar" onclick={cargarDatos}>Reintentar</button>
    </div>
  {/if}

  <!-- Tarjetas de estadísticas -->
  <section class="stats" aria-label="Estadísticas generales">
    {#each stats as s (s.id)}
      <div class="stat-card" class:cargando>
        <span class="stat-icono" aria-hidden="true">{s.icono}</span>
        <p class="stat-label">{s.label}</p>
        <p class="stat-valor">{cargando ? '…' : s.valor}</p>
        <p class="stat-sub">{cargando ? 'Cargando...' : s.sub}</p>
      </div>
    {/each}
  </section>


<!-- Tarjetas de navegación -->
<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<section class="nav-cards" aria-label="Módulos del sistema">
  {#each navCards as c (c.id)}
    <a
      href={resolve(c.href)}
      class="nav-card"
      style={`--link-color: ${c.colorLink}`}
      data-sveltekit-preload-data="hover"
    >
      <div class={`nav-card-acento ${c.acento}`}></div>

      <div class="nav-card-body">
        <span class="nav-icono">{c.icono}</span>
        <h2 class="nav-titulo">{c.titulo}</h2>
        <p class="nav-desc">{c.descripcion}</p>

        <span class="nav-link-text">
          Ir a {c.titulo} →
        </span>
      </div>
    </a>
  {/each}
</section>


  <!-- Actividad reciente -->
  <section class="actividad-wrap" aria-label="Actividad reciente">
    <h3 class="seccion-titulo">Actividad reciente</h3>

    {#if cargando}
      <p class="estado-msg">Cargando actividad...</p>
    {:else if actividad.length === 0}
      <p class="estado-msg">No hay actividad registrada aún.</p>
    {:else}
      <ul class="actividad-lista">
        {#each actividad as a (a.id)}
          <li class="actividad-item">
            <div class="avatar avatar-{a.color}" aria-hidden="true">{a.iniciales}</div>
            <div class="actividad-info">
              <p class="actividad-nombre">{a.nombre}</p>
              <p class="actividad-detalle">{a.detalle}</p>
            </div>
            <time class="actividad-tiempo">{a.tiempo}</time>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

</div>

<!-- ───────────────────── ESTILOS SCOPED ───────────────────── -->
<style>
  .dash {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    animation: fadeIn 0.25s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Encabezado ── */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .titulo {
    font-size: clamp(1.25rem, 3vw, 1.6rem);
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
  }

  .subtitulo {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
    text-transform: capitalize;
  }

  .badge-live {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--color-success-light);
    color: var(--color-success);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.3rem 0.7rem;
    border-radius: 99px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-success);
    display: inline-block;
    flex-shrink: 0;
  }

  /* ── Error ── */
  .error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.875rem;
    color: var(--color-danger);
    background: var(--color-danger-light);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: var(--radius-md);
    padding: 0.625rem 1rem;
  }

  .btn-reintentar {
    background: none;
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .btn-reintentar:hover {
    background: var(--color-danger);
    color: #fff;
  }

  /* ── Stats ── */
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.1rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.18s, transform 0.18s, opacity 0.18s;
  }

  .stat-card.cargando {
    opacity: 0.6;
  }

  .stat-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .stat-icono {
    font-size: 1.4rem;
    margin-bottom: 6px;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-valor {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.1;
    margin-top: 2px;
  }

  .stat-sub {
    font-size: 0.75rem;
    color: var(--color-text-hint);
    margin-top: 2px;
  }

  /* ── Tarjetas de navegación ── */
  .nav-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1rem;
  }

  .nav-card {
    position: relative;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    text-decoration: none;
    overflow: hidden;
    display: block;
    transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
    box-shadow: var(--shadow-sm);
  }

  .nav-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-border-hover);
  }

  .nav-card:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
  }

  .nav-card-acento { height: 4px; width: 100%; }
  .acento-blue     { background: linear-gradient(90deg, #1d4ed8, #60a5fa); }
  .acento-violet   { background: linear-gradient(90deg, #6d28d9, #a78bfa); }

  .nav-card-body {
    padding: 1.3rem 1.4rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-icono {
    font-size: 1.6rem;
    margin-bottom: 6px;
    line-height: 1;
    display: block;
  }

  .nav-titulo {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .nav-desc {
    font-size: 0.83rem;
    color: var(--color-text-muted);
    line-height: 1.55;
    margin: 4px 0 12px;
  }

  .nav-link-text {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--link-color, #2563eb);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: gap 0.15s;
  }

  .nav-card:hover .nav-link-text { gap: 7px; }

  /* ── Actividad ── */
  .actividad-wrap {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.3rem 1.4rem;
    box-shadow: var(--shadow-sm);
  }

  .seccion-titulo {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 0.875rem;
  }

  .estado-msg {
    font-size: 0.875rem;
    color: var(--color-text-hint);
    padding: 0.5rem 0;
  }

  .actividad-lista {
    list-style: none;
    display: flex;
    flex-direction: column;
  }

  .actividad-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .actividad-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 700;
    flex-shrink: 0;
    letter-spacing: 0.03em;
  }

  .avatar-blue   { background: #dbeafe; color: #1d4ed8; }
  .avatar-green  { background: #dcfce7; color: #15803d; }
  .avatar-amber  { background: #fef3c7; color: #b45309; }

  .actividad-info {
    flex: 1;
    min-width: 0;
  }

  .actividad-nombre {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actividad-detalle {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actividad-tiempo {
    font-size: 0.72rem;
    color: var(--color-text-hint);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── Responsivo ── */
  @media (max-width: 600px) {
    .dash        { padding: 1.25rem 1rem; gap: 1.25rem; }
    .stats       { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
    .nav-cards   { grid-template-columns: 1fr; }
    .actividad-nombre,
    .actividad-detalle { white-space: normal; }
  }
</style>