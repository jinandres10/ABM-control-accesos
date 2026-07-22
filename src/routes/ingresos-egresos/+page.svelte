<script lang="ts">
    import type { PageData } from './$types';
    import type { IngresoEgreso } from '$lib/types';
    import * as XLSX from 'xlsx'

    /**
     * =========================================
     * PROPS SSR
     * =========================================
     */
    const { data } = $props<{ data: PageData }>();



    /**
     * =========================================
     * 🔥 NORMALIZADOR DE PERFIL (CLAVE DEL FIX)
     * -----------------------------------------
     * Supabase puede devolver:
     * - objeto → correcto
     * - array → ⚠️ rompe frontend
     *
     * 👉 esta función garantiza SIEMPRE objeto
     * =========================================
     */
    function getPerfil(p: any) {
        return Array.isArray(p) ? p[0] : p;
    }

    /**
     * =========================================
     * FILTROS
     * =========================================
     */
    let filtroUsuario = $state('');
    let filtroEdificio = $state('');
    
    // 📅 Por defecto: hoy
    const hoy = new Date();
    const fechaHoy =
        `${String(hoy.getDate()).padStart(2, '0')}/` +
        `${String(hoy.getMonth() + 1).padStart(2, '0')}/` +
        `${hoy.getFullYear()}`;

    let filtroFecha = $state(fechaHoy);

    /**
     * =========================================
     * NORMALIZAR FECHA DD/MM/YYYY
     * =========================================
     */
    function normalizarFecha(fecha: string): string {
        const d = new Date(fecha);

        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();

        return `${dia}/${mes}/${anio}`;
    }

    /**
     * =========================================
     * FORMATO FECHA Y HORA
     * =========================================
     */
    function formatFecha(ts: string): string {
        return new Date(ts).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * =========================================
     * EXPORTAR A EXCEL
     * =========================================
     */
    function exportarExcel() {

        const datos = ingresosFiltrados.map((i) => {

            // ✅ NORMALIZAMOS PERFIL (IMPORTANTE)
            const perfil = getPerfil(i.perfiles);

            return {

                ID: i.id,
                ID_USUARIO: i.id_usuario,
                USUARIO: i.usuario,

                // ✅ usamos perfil seguro
                NOMBRE: perfil?.nombre ?? '',
                APELLIDO: perfil?.apellido ?? '',
                DOCUMENTO: perfil?.doc ?? '',

                ID_EDIFICIO: i.id_edificio,
                NOMBRE_EDIFICIO: i.nombre_edificio,

                GEO_EDIFICIO_LAT: i.geo_edificio_lat,
                GEO_EDIFICIO_LNG: i.geo_edificio_lng,

                GEO_USUARIO_LAT: i.geo_usuario_lat,
                GEO_USUARIO_LNG: i.geo_usuario_lng,

                DISTANCIA_METROS: i.distancia_metros,

                FECHA: i.fecha,


                CREADO_EN: formatFecha(i.creado_en),

                FUE_OFFLINE: i.fue_offline ? 'SI' : 'NO',
                ONLINE_STATUS: i.online_status ? 'SI' : 'NO',
                GPS_DISPONIBLE: i.gps_disponible ? 'SI' : 'NO',

                DEVICE_NAME: i.device_name,
                OS: i.os,
                BROWSER: i.browser
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(datos);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            'RegistroPresencia'
        );

        XLSX.writeFile(
            workbook,
            `registro_presencia_${new Date().toISOString().substring(0, 10)}.xlsx`
        );
    }

    /**
     * =========================================
     * LISTADO FILTRADO + ORDENADO
     * =========================================
     */
    const ingresosFiltrados = $derived(

        [...(data.ingresos ?? [])]

            // ✅ ORDEN: más reciente primero
            .sort((a: IngresoEgreso, b: IngresoEgreso) =>
                new Date(b.creado_en).getTime() -
                new Date(a.creado_en).getTime()
            )

            .filter((i: IngresoEgreso) => {

                // ✅ PERFIL NORMALIZADO
                const perfil = getPerfil(i.perfiles);

                const textoBusqueda =
                    filtroUsuario.trim().toLowerCase();

                /* =========================
                   FILTRO USUARIO (MEJORADO)
                ========================= */


                const docBusqueda = textoBusqueda.replace(/\D/g, '');

                const cumpleUsuario =
                    !textoBusqueda ||

                    (i.usuario ?? '')
                        .toLowerCase()
                        .includes(textoBusqueda) ||

                    (perfil?.nombre ?? '')
                        .toLowerCase()
                        .includes(textoBusqueda) ||

                    (perfil?.apellido ?? '')
                        .toLowerCase()
                        .includes(textoBusqueda) ||

                    String(perfil?.doc ?? '')
                        .replace(/\D/g, '')
                        .includes(docBusqueda) ||

                    `${perfil?.nombre ?? ''} ${perfil?.apellido ?? ''}`
                        .toLowerCase()
                        .includes(textoBusqueda);

                /* =========================
                   FILTRO EDIFICIO
                ========================= */
                const cumpleEdificio =
                    !filtroEdificio ||
                    i.nombre_edificio
                        ?.toLowerCase()
                        .includes(
                            filtroEdificio.toLowerCase()
                        );

                /* =========================
                   FILTRO FECHA
                ========================= */
                const fechaRegistro =
                    normalizarFecha(i.creado_en);

                const cumpleFecha =
                    !filtroFecha ||
                    fechaRegistro.includes(filtroFecha);

                return (
                    cumpleUsuario &&
                    cumpleEdificio &&
                    cumpleFecha
                );
            })

    );
</script>

<div class="page">

    <h1>📍 Registro de Presencia</h1>

    <!-- FILTROS -->
    <div class="filtros">

        <input
            type="text"
            placeholder="👤 Usuario / Nombre / Apellido / Nro. Doc."
            bind:value={filtroUsuario}
        />

        <input
            type="text"
            placeholder="🏢 Filtrar por edificio"
            bind:value={filtroEdificio}
        />

        <input
            type="text"
            placeholder="📅 dd/mm/yyyy"
            bind:value={filtroFecha}
        />

    </div>

    <!-- BOTÓN -->
    <div class="acciones">
        <button class="btn-exportar" onclick={exportarExcel}>
            📊 Exportar Excel
        </button>
    </div>

    <!-- TABLA -->
    <div class="table-wrap">

        <table>

            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Documento</th>
                    <th>Edificio</th>
                    <th>Fecha</th>
                    <th>Distancia</th>
                    <th>GPS</th>
                    <th>Online</th>
                </tr>
            </thead>

            <tbody>

                {#each ingresosFiltrados as i (i.id)}

                    {@const perfil = getPerfil(i.perfiles)}

                    <tr>

                        <td>{i.usuario}</td>

                   
                        <td>{perfil?.nombre ?? '-'}</td>
                        <td>{perfil?.apellido ?? '-'}</td>
                        <td>{perfil?.doc ?? '-'}</td>

                        <td>{i.nombre_edificio}</td>

                        <td>{formatFecha(i.creado_en)}</td>

                        <td>
                            {Math.round(i.distancia_metros ?? 0)} m
                        </td>

                        <td>
                            {i.gps_disponible ? '✅' : '❌'}
                        </td>

                        <td>
                            {i.online_status ? '🟢' : '🔴'}
                        </td>

                    </tr>

                {:else}

                    <tr>
                        <td colspan="8" class="vacio">
                            No hay registros encontrados
                        </td>
                    </tr>

                {/each}

            </tbody>

        </table>

    </div>

</div>

<style>
    .filtros {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin: 20px 0;
    }

    .filtros input {
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        font-size: 14px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th,
    td {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
    }

    .acciones {
        margin-bottom: 15px;
    }

    .btn-exportar {
        background: #16a34a;
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
    }
</style>