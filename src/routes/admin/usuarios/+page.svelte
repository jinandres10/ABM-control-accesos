<script lang="ts">
	import { onMount } from 'svelte'

	/* =========================
	   MODELO
	========================= */
	type Usuario = {
			id: string

			email: string

			nombre: string
			apellido: string
			telefono: string

			rol: 'admin' | 'operador' | 'viewer'

			intentos_fallidos: number
			bloqueada: boolean

			creado_en: string
			/* =========================
			BAJA LÓGICA
			========================= */

			activo: boolean

			fecha_baja: string | null
	}

	/* =========================
	   STATE
	========================= */
	let usuarios = $state<Usuario[]>([])
	let cargando = $state(true)
	let mensaje = $state('')

	let busqueda = $state('')

	/* =========================
   FILTRO BAJAS
	========================= */

	let mostrarBajas = $state(false)

	/* =========================
	$effect(() => {

	mostrarBajas

	cargarUsuarios()

	})
	========================= */

	let email = $state('')
	let password = $state('')
	let nombre = $state('')
	let apellido = $state('')
	let telefono = $state('')

	let rol = $state<'admin' | 'operador' | 'viewer'>('viewer')

	/* =========================
	   FILTRO
	========================= */
	let usuariosFiltrados = $derived.by<Usuario[]>(() => {

		const texto = busqueda.trim().toLowerCase()

		return usuarios.filter((u) => {

			/* =========================
			FILTRO ACTIVOS / BAJAS
			========================= */

			if (!mostrarBajas && !u.activo) {
				return false
			}

			/* =========================
			FILTRO TEXTO
			========================= */

			if (!texto) {
				return true
			}

			return (

				(u.nombre ?? '').toLowerCase().includes(texto)
				||
				(u.apellido ?? '').toLowerCase().includes(texto)
				||
				(u.email ?? '').toLowerCase().includes(texto)
				||
				(u.telefono ?? '').toLowerCase().includes(texto)
			)
			
		})
	})
	onMount(() => {
		cargarUsuarios()
	})

	/* =========================
	   API
	========================= */

	async function cargarUsuarios() {

		cargando = true

		try {

			const url =
				mostrarBajas
					? '/api/admin/users?incluirBajas=true'
					: '/api/admin/users'

			const res = await fetch(url)

			const data = await res.json()

			if (!res.ok) {

				mensaje =
					data.error ??
					'Error cargando usuarios'

				return
			}

			usuarios = data.usuarios ?? []

		} catch (error) {

			console.error(error)

			mensaje =
				'Error inesperado al cargar usuarios'

		} finally {

			cargando = false
		}
	}

	async function crear() {

		if (!email || !password || !nombre) {
			mensaje = 'Completá email, password y nombre'
			return
		}

		const res = await fetch('/api/admin/users', {
			method: 'POST',

			headers: {
				'Content-Type': 'application/json'
			},

			body: JSON.stringify({
				email,
				password,
				nombre,
				apellido,
				telefono,
				rol
			})
		})

		const data = await res.json()

		if (data.error) {
			mensaje = data.error
			return
		}

		await cargarUsuarios()

		email = ''
		password = ''
		nombre = ''
		apellido = ''
		telefono = ''

		rol = 'viewer'

		mensaje = '✅ Usuario creado'
	}
	async function guardar(u: Usuario) {

		const res = await fetch(
			`/api/admin/users/${u.id}`,
			{
				method: 'PUT',

				headers: {
					'Content-Type': 'application/json'
				},

				body: JSON.stringify({
					nombre: u.nombre,
					apellido: u.apellido,
					telefono: u.telefono,
					rol: u.rol,
					activo: u.activo
				})
			}
		)

		const data = await res.json()

		if (!res.ok) {

			alert(
				`❌ Error al guardar:\n${data.error}`
			)

			return
		}

		alert('✅ Usuario actualizado')
	}


	async function resetPassword(u: Usuario) {

	const nueva = prompt(
		`Nueva contraseña para ${u.email}`
	)

	if (!nueva) return

	// Validación local
	if (nueva.length < 6) {

		alert(
			'❌ La contraseña debe tener al menos 6 caracteres'
		)

		return
	}

		const res = await fetch(
			`/api/admin/users/${u.id}`,
			{
				method: 'PATCH',

				headers: {
					'Content-Type': 'application/json'
				},

				body: JSON.stringify({
					password: nueva
				})
			}
		)

		const data = await res.json()

		// Si el backend devuelve error
		if (!res.ok) {

			alert(
				`❌ Error al actualizar contraseña:\n${data.error}`
			)

			return
		}

		alert('🔑 Contraseña actualizada correctamente')
	}

	async function desbloquear(u: Usuario) {

		await fetch(`/api/admin/users/${u.id}`, {

			method: 'PUT',

			headers: {
				'Content-Type': 'application/json'
			},

			body: JSON.stringify({
				bloqueada: false,
				intentos_fallidos: 0
			})
		})

		await cargarUsuarios()
	}

	/* =========================
   BAJA LÓGICA
	========================= */

	async function darBaja(u: Usuario) {

		if (
			!confirm(
				`¿Dar de baja al usuario ${u.email}?`
			)
		) {
			return
		}

		const res = await fetch(
			`/api/admin/users/${u.id}`,
			{
				method: 'PUT',

				headers: {
					'Content-Type': 'application/json'
				},

				body: JSON.stringify({

					activo: false,

					fecha_baja:
						new Date().toISOString()
				})
			}
		)

		const data = await res.json()

		if (!res.ok) {

			alert(
				`❌ Error:\n${data.error}`
			)

			return
		}

		await cargarUsuarios()

		alert(
			'✅ Usuario dado de baja'
		)
	}

	/* =========================
   	REACTIVAR USUARIO
	========================= */

	async function reactivar(u: Usuario) {

		const res = await fetch(
			`/api/admin/users/${u.id}`,
			{
				method: 'PUT',

				headers: {
					'Content-Type': 'application/json'
				},

				body: JSON.stringify({

					activo: true,

					fecha_baja: null
				})
			}
		)

		const data = await res.json()

		if (!res.ok) {

			alert(
				`❌ Error:\n${data.error}`
			)

			return
		}

		await cargarUsuarios()

		alert(
			'✅ Usuario reactivado'
		)
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

<div class="mb-4 flex items-center justify-between">

	<input
		class="border rounded-lg p-2 w-full md:w-2/3 focus:ring-2 focus:ring-blue-500"
		placeholder="🔍 Buscar usuario..."
		bind:value={busqueda}
	/>

<div class="ml-4 flex items-center gap-2 whitespace-nowrap">

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
	     FORMULARIO
	========================= -->

	<div class="bg-white shadow-lg rounded-2xl p-6 mb-6 border">

		<h3 class="font-semibold mb-4 text-gray-700">
			Crear usuario
		</h3>

		<div class="grid grid-cols-1 md:grid-cols-6 gap-3">

			<input
				class="border rounded-lg p-2 w-full text-sm"
				placeholder="Email"
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
				placeholder="Teléfono"
				bind:value={telefono}
			/>

			<select
				class="border rounded-lg p-2 w-full text-sm"
				bind:value={rol}
			>
				<option value="viewer">Viewer</option>
				<option value="operador">Operador</option>
				<option value="admin">Admin</option>
			</select>

		</div>

		<button
			class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
			onclick={crear}
		>
			➕ Crear usuario
		</button>

		{#if mensaje}

			<p class="mt-3 text-sm text-gray-600">
				{mensaje}
			</p>

		{/if}

	</div>

	<!-- =========================
	     TABLA
	========================= -->

	<div class="bg-white shadow-lg rounded-2xl overflow-hidden border">

		{#if cargando}

			<p class="p-6">
				Cargando usuarios...
			</p>

		{:else}

			<div class="flex gap-1 justify-center">

				<table class="w-full text-sm">

					<thead class="bg-gray-100 text-gray-600 text-xs uppercase">

						<tr>
							<th class="p-2 text-left">Email</th>
							<th class="p-2 text-left">Nombre</th>
							<th class="p-2 text-left">Apellido</th>
							<th class="p-2 text-left">Teléfono</th>
							<th class="p-2 text-left">Rol</th>
							<th class="p-2 text-center">Intentos</th>
							<th class="p-2 text-center">Bloqueado</th>
							<th class="p-2 text-center">Baja</th>
							<th class="p-2 text-center w-48">
								Acciones</th>
						</tr>

					</thead>

					<tbody>

						{#each usuariosFiltrados as u (u.id)}

							<tr class="border-t hover:bg-gray-50">

								<td class="p-2">
									{u.email}
								</td>

								<td class="p-2">

									<input
										class="border rounded-md px-2 py-1 w-full text-sm"
										bind:value={u.nombre}
									/>

								</td>

								<td class="p-2">

									<input
										class="border rounded-md px-2 py-1 w-full text-sm"
										bind:value={u.apellido}
									/>

								</td>

								<td class="p-2">

									<input
										class="border rounded-md px-2 py-1 w-full text-sm"
										bind:value={u.telefono}
									/>

								</td>

								<td class="p-2">

									<select
										class="border rounded-md px-2 py-1 w-full text-sm"
										bind:value={u.rol}
									>
										<option value="viewer">viewer</option>
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

										<span
											class="bg-green-100
											text-green-700
											px-2 py-1
											rounded-full
											text-xs"
										>
											Activo
										</span>

									{:else}

										<span
											class="bg-red-100
											text-red-700
											px-2 py-1
											rounded-full
											text-xs"
										>
											Baja
										</span>

									{/if}

								</td>

								<td class="p-2">

									<div class="flex flex-wrap gap-1 justify-center">

										<button
											class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[11px]"
											onclick={() => guardar(u)}
											title="Guardar cambios"
										>
											💾
										</button>

										<button
											class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-[11px]"
											onclick={() => resetPassword(u)}
											title="Restablecer contraseña"
										>
											🔑
										</button>

										<button
											class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-[11px]"
											onclick={() => desbloquear(u)}
											title="Desbloquear usuario"
										>
											🔓
										</button>

										{#if u.activo}

											<button
												class="bg-red-600 hover:bg-red-700
												text-white px-2 py-1 rounded
												text-[11px]"
												onclick={() => darBaja(u)}
												title="Dar de baja"
											>
												🚫
											</button>

										{:else}

											<button
												class="bg-green-600 hover:bg-green-700
												text-white px-2 py-1 rounded
												text-[11px]"
												onclick={() => reactivar(u)}
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

			</div>

		{/if}

	</div>

</div>