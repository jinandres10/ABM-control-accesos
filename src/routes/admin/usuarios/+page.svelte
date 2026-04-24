<script lang="ts">
	/* =========================
	   MODELO
	========================= */
	type Usuario = {
		id: string
		email: string
		nombre: string
		rol: 'admin' | 'operador' | 'viewer'
		intentos_fallidos: number
		bloqueada: boolean
	}

	/* =========================
	   STATE (Svelte 5)
	========================= */
	let usuarios = $state<Usuario[]>([])
	let cargando = $state(true)
	let mensaje = $state('')

	let email = $state('')
	let password = $state('')
	let nombre = $state('')
	let rol = $state<'admin' | 'operador' | 'viewer'>('viewer')

	import { onMount } from 'svelte'

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

		if (data.error) mensaje = data.error
		else usuarios = data.usuarios

		cargando = false
	}

	async function crear() {
		const res = await fetch('/api/admin/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password, nombre, rol })
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
		rol = 'viewer'

		mensaje = '✅ Usuario creado'
	}

	async function guardar(u: Usuario) {
		await fetch(`/api/admin/users/${u.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: u.nombre,
				rol: u.rol
			})
		})

		alert('✅ Guardado')
	}

	async function eliminar(id: string) {
		if (!confirm('¿Eliminar usuario?')) return

		await fetch(`/api/admin/users/${id}`, {
			method: 'DELETE'
		})

		usuarios = usuarios.filter(u => u.id !== id)
	}

	async function resetPassword(u: Usuario) {
		const nueva = prompt(`Nueva contraseña para ${u.email}`)
		if (!nueva) return

		await fetch(`/api/admin/users/${u.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: nueva })
		})

		alert('🔑 Contraseña actualizada')
	}

	async function desbloquear(u: Usuario) {
		await fetch(`/api/admin/users/${u.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				bloqueada: false,
				intentos_fallidos: 0
			})
	})

	await cargarUsuarios()
}


</script>

<!-- CONTENEDOR -->
<div class="max-w-6xl mx-auto p-6">

	<h2 class="text-2xl font-bold mb-6 text-gray-800">
		👥 Panel de Usuarios
	</h2>

	<!-- FORM -->
	<div class="bg-white shadow-lg rounded-2xl p-6 mb-6 border">

		<h3 class="font-semibold mb-4 text-gray-700">
			Crear usuario
		</h3>

		<div class="grid grid-cols-1 md:grid-cols-4 gap-3">

			<input
				class="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500"
				placeholder="Email"
				bind:value={email}
			/>

			<input
				class="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500"
				type="password"
				placeholder="Password"
				bind:value={password}
			/>

			<input
				class="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500"
				placeholder="Nombre"
				bind:value={nombre}
			/>

			<select
				class="border rounded-lg p-2 w-full"
				bind:value={rol}
			>
				<option value="viewer">Viewer</option>
				<option value="operador">Operador</option>
				<option value="admin">Admin</option>
			</select>

		</div>

		<button
			class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
			onclick={crear}
		>
			Crear usuario
		</button>

		{#if mensaje}
			<p class="mt-2 text-sm text-gray-600">{mensaje}</p>
		{/if}
	</div>

	<!-- TABLA -->
	<div class="bg-white shadow-lg rounded-2xl overflow-hidden border">

		{#if cargando}
			<p class="p-6">Cargando usuarios...</p>

		{:else}

			<table class="w-full text-sm">

				<thead class="bg-gray-100 text-gray-600 text-xs uppercase">
					<tr>
						<th class="p-3 text-left">Email</th>
						<th class="p-3">Nombre</th>
						<th class="p-3">Rol</th>
						<th class="p-3">Intentos</th>
						<th class="p-3">Estado</th>
						<th class="p-3">Acciones</th>
					</tr>
				</thead>

				<tbody>
					{#each usuarios as u (u.id)}
						<tr class="border-t hover:bg-gray-50">

							<td class="p-3">{u.email}</td>

							<td class="p-3">
								<input
									class="border rounded-md p-1 w-full text-sm"
									bind:value={u.nombre}
								/>
							</td>

							<td class="p-3">
								<select
									class="border rounded-md p-1 w-full text-sm"
									bind:value={u.rol}
								>
									<option value="viewer">viewer</option>
									<option value="operador">operador</option>
									<option value="admin">admin</option>
								</select>
							</td>

							<td class="p-3 text-center">
								{u.intentos_fallidos ?? 0}
							</td>

							<td class="p-3 text-center">
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

							<td class="p-3">
								<div class="flex flex-wrap gap-2 justify-center">

									<button
										class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs"
										onclick={() => guardar(u)}
									>
										Guardar
									</button>

									<button
										class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs"
										onclick={() => resetPassword(u)}
									>
										Clave
									</button>

									<button
										class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-xs"
										onclick={() => desbloquear(u)}
									>
										Unlock
									</button>

									<button
										class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs"
										onclick={() => eliminar(u.id)}
									>
										Eliminar
									</button>

								</div>
							</td>

						</tr>
					{/each}
				</tbody>

			</table>

		{/if}
	</div>
</div>