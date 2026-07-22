<script lang="ts">
	import { onMount } from 'svelte'
	import { SvelteSet } from 'svelte/reactivity'

	/* =========================
	   MODELO
	   (agrego "as const" implícito vía union types para evitar strings sueltos)
	========================= */
	type Rol = 'admin' | 'operador'

	type Usuario = {
		id: string
		email: string
		nombre: string
		apellido: string
		telefono: string
		doc: number | null
		rol: Rol
		intentos_fallidos: number
		bloqueada: boolean
		creado_en: string
		/* BAJA LÓGICA */
		activo: boolean
		fecha_baja: string | null
	}

	/* Respuesta genérica esperada de la API para tipar sin usar "any" */
	type ApiResponse<T = unknown> = {
		error?: string
		usuarios?: Usuario[]
	} & T

	type RequestInit = globalThis.RequestInit
	/* =========================
	   STATE PRINCIPAL
	========================= */
	let usuarios = $state<Usuario[]>([])
	let cargando = $state(true)
	let mensaje = $state('')
	let busqueda = $state('')
	let mostrarBajas = $state(false)

	/* =========================
	   STATE DEL FORMULARIO DE CREACIÓN
	========================= */
	let email = $state('')
	let password = $state('')
	let nombre = $state('')
	let apellido = $state('')
	let telefono = $state('')
	let rol = $state<Rol>('operador')
	// Se maneja como string porque viene de un <input>, se castea a number recién al enviar
	let doc = $state('')
	let creando = $state(false) // evita doble submit mientras se crea el usuario

	/* =========================
	   ESTADOS DE CARGA POR FILA
	   Un Set con los ids de usuarios que tienen una acción en curso.
	   Esto evita que el usuario haga doble click y dispare pedidos duplicados,
	   y permite deshabilitar/mostrar spinners por fila sin afectar al resto.
	========================= */
	let filasEnProceso = $state<Set<string>>(new Set())

	function marcarEnProceso(id: string, activo: boolean) {
		// Creamos un Set nuevo para que Svelte detecte el cambio de referencia
	
		const nuevo = new SvelteSet<string>(filasEnProceso)
		if (activo) {
			nuevo.add(id)
		} else {
			nuevo.delete(id)
		}
		filasEnProceso = nuevo
	}

	/* =========================
	   HELPER CENTRAL DE FETCH
	   Centraliza headers, parseo de JSON y manejo de errores para no
	   repetir el mismo bloque try/catch en cada función de acción.
	========================= */
	async function apiRequest<T = unknown>(
		url: string,
		options: RequestInit = {}
	): Promise<{ ok: boolean; data: ApiResponse<T> }> {
		try {
			const res = await fetch(url, {
				headers: { 'Content-Type': 'application/json' },
				...options
			})
			// Si el backend no devuelve JSON válido, evitamos que explote el parseo
			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				return {
					ok: false,
					data: { error: data.error ?? 'Error inesperado del servidor', ...data }
				}
			}
			return { ok: true, data }
		} catch (error) {
			console.error('Error de red:', error)
			return {
				ok: false,
				data: { error: 'No se pudo conectar con el servidor' } as ApiResponse<T>
			}
		}
	}

	/* =========================
	   FILTRO (activos/bajas + búsqueda de texto)
	========================= */
	let usuariosFiltrados = $derived.by<Usuario[]>(() => {
		const texto = busqueda.trim().toLowerCase()
		return usuarios.filter((u) => {
			// Si no se pidió ver bajas, ocultamos los usuarios inactivos
			if (!mostrarBajas && !u.activo) {
				return false
			}
			// Sin texto de búsqueda, no seguimos filtrando
			if (!texto) {
				return true
			}
			return (
				(u.nombre ?? '').toLowerCase().includes(texto) ||
				(u.apellido ?? '').toLowerCase().includes(texto) ||
				(u.email ?? '').toLowerCase().includes(texto) ||
				(u.telefono ?? '').toLowerCase().includes(texto) ||
				String(u.doc ?? '').includes(texto)
			)
		})
	})

	onMount(() => {
		cargarUsuarios()
	})

	/* =========================
	   API: LISTAR USUARIOS
	========================= */
	async function cargarUsuarios() {
		cargando = true
		const url = mostrarBajas
			? '/api/admin/users?incluirBajas=true'
			: '/api/admin/users'

		const { ok, data } = await apiRequest<{ usuarios: Usuario[] }>(url)

		if (!ok) {
			mensaje = data.error ?? 'Error cargando usuarios'
			cargando = false
			return
		}

		usuarios = data.usuarios ?? []
		cargando = false
	}

	/* =========================
	   API: CREAR USUARIO
	========================= */
	async function crear() {
		// Validaciones locales antes de pegarle al backend
		if (!email || !password || !nombre || !doc) {
			mensaje = 'Completá email, password, documento y nombre'
			return
		}
		if (password.length < 6) {
			mensaje = 'La contraseña debe tener al menos 6 caracteres'
			return
		}
		if (Number.isNaN(Number(doc))) {
			mensaje = 'El documento debe ser numérico'
			return
		}

		creando = true
		const { ok, data } = await apiRequest('/api/admin/users', {
			method: 'POST',
			body: JSON.stringify({
				email,
				password,
				nombre,
				apellido,
				telefono,
				doc: Number(doc), // normalizamos a number para que coincida con el tipo Usuario
				rol
			})
		})
		creando = false

		if (!ok) {
			mensaje = data.error ?? 'Error al crear usuario'
			return
		}

		await cargarUsuarios()

		// Reseteo del formulario solo si la creación fue exitosa
		email = ''
		password = ''
		nombre = ''
		apellido = ''
		telefono = ''
		doc = ''
		rol = 'operador'
		mensaje = '✅ Usuario creado'
	}

	/* =========================
	   API: GUARDAR CAMBIOS DE UN USUARIO (fila editable)
	========================= */
	async function guardar(u: Usuario) {
		marcarEnProceso(u.id, true)
		const { ok, data } = await apiRequest(`/api/admin/users/${u.id}`, {
			method: 'PUT',
			body: JSON.stringify({
				nombre: u.nombre,
				apellido: u.apellido,
				telefono: u.telefono,
				doc: u.doc,
				rol: u.rol,
				activo: u.activo
			})
		})
		marcarEnProceso(u.id, false)

		if (!ok) {
			alert(`❌ Error al guardar:\n${data.error}`)
			return
		}
		alert('✅ Usuario actualizado')
	}

	/* =========================
	   API: RESETEAR CONTRASEÑA
	========================= */
	async function resetPassword(u: Usuario) {
		const nueva = prompt(`Nueva contraseña para ${u.email}`)
		if (!nueva) return

		if (nueva.length < 6) {
			alert('❌ La contraseña debe tener al menos 6 caracteres')
			return
		}

		marcarEnProceso(u.id, true)
		const { ok, data } = await apiRequest(`/api/admin/users/${u.id}`, {
			method: 'PATCH',
			body: JSON.stringify({ password: nueva })
		})
		marcarEnProceso(u.id, false)

		if (!ok) {
			alert(`❌ Error al actualizar contraseña:\n${data.error}`)
			return
		}
		alert('🔑 Contraseña actualizada correctamente')
	}

	/* =========================
	   API: DESBLOQUEAR USUARIO
	========================= */
	async function desbloquear(u: Usuario) {
		marcarEnProceso(u.id, true)
		const { ok, data } = await apiRequest(`/api/admin/users/${u.id}`, {
			method: 'PUT',
			body: JSON.stringify({
				bloqueada: false,
				intentos_fallidos: 0
			})
		})
		marcarEnProceso(u.id, false)

		if (!ok) {
			alert(`❌ Error al desbloquear:\n${data.error}`)
			return
		}
		await cargarUsuarios()
	}

	/* =========================
	   API: DAR DE BAJA (baja lógica)
	========================= */
	async function darBaja(u: Usuario) {
		if (!confirm(`¿Dar de baja al usuario ${u.email}?`)) {
			return
		}

		marcarEnProceso(u.id, true)
		const { ok, data } = await apiRequest(`/api/admin/users/${u.id}`, {
			method: 'PUT',
			body: JSON.stringify({
				activo: false,
				fecha_baja: new Date().toISOString()
			})
		})
		marcarEnProceso(u.id, false)

		if (!ok) {
			alert(`❌ Error:\n${data.error}`)
			return
		}
		await cargarUsuarios()
		alert('✅ Usuario dado de baja')
	}

	/* =========================
	   API: REACTIVAR USUARIO
	========================= */
	async function reactivar(u: Usuario) {
		marcarEnProceso(u.id, true)
		const { ok, data } = await apiRequest(`/api/admin/users/${u.id}`, {
			method: 'PUT',
			body: JSON.stringify({
				activo: true,
				fecha_baja: null
			})
		})
		marcarEnProceso(u.id, false)

		if (!ok) {
			alert(`❌ Error:\n${data.error}`)
			return
		}
		await cargarUsuarios()
		alert('✅ Usuario reactivado')
	}
</script>

<!-- =========================
     CONTENEDOR
========================= -->
<div class="max-w-7xl mx-auto p-6">

	<!-- HEADER -->
	<h2 class="text-2xl font-bold mb-6 text-gray-800">
		👥 Panel de Usuarios
	</h2>

	<!-- =========================
	     BUSCADOR y FILTRO DE BAJAS
	========================= -->
	<div class="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">

		<input
			class="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500"
			placeholder="🔍 Buscar usuario..."
			bind:value={busqueda}
		/>

		<div class="flex items-center gap-2">
			<input
				id="mostrar-bajas"
				type="checkbox"
				bind:checked={mostrarBajas}
				onchange={() => cargarUsuarios()}
				class="h-5 w-5 appearance-auto cursor-pointer"
			/>
			<label
				for="mostrar-bajas"
				class="text-sm text-gray-700 cursor-pointer select-none"
			>
				Mostrar usuarios dados de baja
			</label>
		</div>
	</div>

	<!-- =========================
	     FORMULARIO DE CREACIÓN
	========================= -->
	<div class="bg-white shadow-lg rounded-2xl p-6 mb-6 border">
		<h3 class="font-semibold mb-4 text-gray-700">
			Crear usuario
		</h3>

		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
			<input
				class="border rounded-lg p-2 w-full min-w-0 text-sm"
				placeholder="Email"
				type="email"
				bind:value={email}
			/>
			<input
				class="border rounded-lg p-2 w-full text-sm"
				type="password"
				placeholder="Password"
				bind:value={password}
			/>
			<input
				class="border rounded-lg p-2 w-full text-sm"
				placeholder="Nombre"
				bind:value={nombre}
			/>
			<input
				class="border rounded-lg p-2 w-full text-sm"
				placeholder="Apellido"
				bind:value={apellido}
			/>
			<input
				class="border rounded-lg p-2 w-full text-sm"
				placeholder="Nro. Doc."
				type="number"
				bind:value={doc}
			/>
			<input
				class="border rounded-lg p-2 w-full text-sm"
				placeholder="Teléfono"
				bind:value={telefono}
			/>
			<select
				class="border rounded-lg p-2 w-full min-w-[130px] text-sm"
				bind:value={rol}
			>
				<option value="operador">Operador</option>
				<option value="admin">Admin</option>
			</select>
		</div>

		<button
			class="mt-4 w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm"
			onclick={crear}
			disabled={creando}
		>
			{creando ? '⏳ Creando...' : '➕ Crear usuario'}
		</button>

		{#if mensaje}
			<p class="mt-3 text-sm text-gray-600">
				{mensaje}
			</p>
		{/if}
	</div>

	<!-- =========================
	     TABLA DE USUARIOS
	========================= -->
	<div class="bg-white shadow-lg rounded-2xl border overflow-x-auto">
		{#if cargando}
			<p class="p-6">Cargando usuarios...</p>
		{:else if usuariosFiltrados.length === 0}
			<p class="p-6 text-gray-500">No se encontraron usuarios.</p>
		{:else}
			<table class="w-full min-w-[1250px] text-sm">
				<thead class="bg-gray-100 text-gray-600 text-xs uppercase">
					<tr>
						<th class="p-2 text-left">Email</th>
						<th class="p-2 text-left">Nombre</th>
						<th class="p-2 text-left">Apellido</th>
						<th class="p-2 text-left">Documento</th>
						<th class="p-2 text-left">Teléfono</th>
						<th class="p-2 text-left w-[100px] min-w-[100px]">Rol</th>
						<th class="p-2 text-center">Intentos</th>
						<th class="p-2 text-center">Bloqueado</th>
						<th class="p-2 text-center">Baja</th>
						<th class="p-2 text-center w-64">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{#each usuariosFiltrados as u (u.id)}
						{@const enProceso = filasEnProceso.has(u.id)}
						<tr class="border-t hover:bg-gray-50">
							<td class="p-2 max-w-[250px] truncate">
								{u.email}
							</td>
							<td class="p-2">
								<input
									class="border rounded-md px-2 py-1 w-full text-sm"
									bind:value={u.nombre}
									disabled={enProceso}
								/>
							</td>
							<td class="p-2">
								<input
									class="border rounded-md px-2 py-1 w-full text-sm"
									bind:value={u.apellido}
									disabled={enProceso}
								/>
							</td>
							<td class="p-2 w-[120px]">
								<input
									class="border rounded-md px-2 py-1 w-full text-sm"
									type="number"
									bind:value={u.doc}
									disabled={enProceso}
								/>
							</td>
							<td class="p-2">
								<input
									class="border rounded-md px-2 py-1 w-full text-sm"
									bind:value={u.telefono}
									disabled={enProceso}
								/>
							</td>
							<td class="p-2">
								<select
									class="border rounded-md px-2 py-1 w-full text-sm"
									bind:value={u.rol}
									disabled={enProceso}
								>
									<option value="operador">operador</option>
									<option value="admin">admin</option>
								</select>
							</td>
							<td class="p-2 text-center">
								{u.intentos_fallidos ?? 0}
							</td>
							<td class="p-2 text-center">
								{#if u.bloqueada}
									<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
										Bloqueado
									</span>
								{:else}
									<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
										Activo
									</span>
								{/if}
							</td>
							<td class="p-2 text-center">
								{#if u.activo}
									<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
										Activo
									</span>
								{:else}
									<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
										Baja
									</span>
								{/if}
							</td>
							<td class="p-2">
								<div class="flex gap-1 justify-center min-w-[220px]">
									<button
										class="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 rounded text-[11px]"
										onclick={() => guardar(u)}
										disabled={enProceso}
										title="Guardar cambios"
									>
										💾
									</button>
									<button
										class="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white px-2 py-1 rounded text-[11px]"
										onclick={() => resetPassword(u)}
										disabled={enProceso}
										title="Restablecer contraseña"
									>
										🔑
									</button>
									<button
										class="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-2 py-1 rounded text-[11px]"
										onclick={() => desbloquear(u)}
										disabled={enProceso}
										title="Desbloquear usuario"
									>
										🔓
									</button>
									{#if u.activo}
										<button
											class="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-1 rounded text-[11px]"
											onclick={() => darBaja(u)}
											disabled={enProceso}
											title="Dar de baja"
										>
											🚫
										</button>
									{:else}
										<button
											class="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 rounded text-[11px]"
											onclick={() => reactivar(u)}
											disabled={enProceso}
											title="Reactivar usuario"
										>
											♻️
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
