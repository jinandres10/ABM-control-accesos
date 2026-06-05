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
	}

	/* =========================
	   STATE
	========================= */
	let usuarios = $state<Usuario[]>([])
	let cargando = $state(true)
	let mensaje = $state('')

	let busqueda = $state('')

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

		if (!busqueda) return usuarios

		const texto = busqueda.toLowerCase()

		return usuarios.filter((u) =>
			u.nombre?.toLowerCase().includes(texto) ||
			u.apellido?.toLowerCase().includes(texto) ||
			u.email?.toLowerCase().includes(texto) ||
			u.telefono?.toLowerCase().includes(texto)
		)
	})

	onMount(() => {
		cargarUsuarios()
	})

	/* =========================
	   API
	========================= */

	async function cargarUsuarios() {

		cargando = true

		const res = await fetch('/api/admin/users')

		const data = await res.json()

		if (data.error) {
			mensaje = data.error
		} else {
			usuarios = data.usuarios
		}

		cargando = false
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
					rol: u.rol
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

	async function eliminar(id: string) {

		if (!confirm('¿Eliminar usuario?')) return

		const res = await fetch(
			`/api/admin/users/${id}`,
			{
				method: 'DELETE'
			}
		)

		const data = await res.json()

		if (!res.ok) {

			alert(
				`❌ Error al eliminar:\n${data.error}`
			)

			return
		}

		usuarios = usuarios.filter(
			(u) => u.id !== id
		)

		alert('🗑️ Usuario eliminado')
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
	     BUSCADOR
	========================= -->

	<div class="mb-4">

		<input
			class="border rounded-lg p-2 w-full md:w-1/3 focus:ring-2 focus:ring-blue-500"
			placeholder="🔍 Buscar usuario..."
			bind:value={busqueda}
		/>

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

			<div class="overflow-x-auto">

				<table class="w-full text-sm">

					<thead class="bg-gray-100 text-gray-600 text-xs uppercase">

						<tr>
							<th class="p-2 text-left">Email</th>
							<th class="p-2 text-left">Nombre</th>
							<th class="p-2 text-left">Apellido</th>
							<th class="p-2 text-left">Teléfono</th>
							<th class="p-2 text-left">Rol</th>
							<th class="p-2 text-center">Intentos</th>
							<th class="p-2 text-center">Estado</th>
							<th class="p-2 text-center">Acciones</th>
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

								<td class="p-2">

									<div class="flex flex-wrap gap-1 justify-center">

										<button
											class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[11px]"
											onclick={() => guardar(u)}
										>
											💾
										</button>

										<button
											class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-[11px]"
											onclick={() => resetPassword(u)}
										>
											🔑
										</button>

										<button
											class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-[11px]"
											onclick={() => desbloquear(u)}
										>
											🔓
										</button>

										<button
											class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[11px]"
											onclick={() => eliminar(u.id)}
										>
											🗑️
										</button>

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