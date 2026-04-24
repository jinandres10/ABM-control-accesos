<script lang="ts">
	/* =========================
	   TYPES
	========================= */

	// Modelo de usuario que viene del backend
	type Usuario = {
		id: string
		email: string
		nombre: string
		rol: string
	}

	/* =========================
	   STATE (Svelte 5 runes)
	========================= */

	// Lista de usuarios
	let usuarios = $state<Usuario[]>([])

	// Estados de UI
	let cargando = $state(true)
	let mensaje = $state('')

	// Formulario de creación
	let email = $state('')
	let password = $state('')
	let nombre = $state('')
	let rol = $state('usuario')

	/* =========================
	   LOAD (onMount)
	========================= */

	import { onMount } from 'svelte'

	onMount(() => {
		cargarUsuarios()
	})

	// Obtener usuarios desde API
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

	/* =========================
	   CREATE USER
	========================= */

	async function crear() {
		mensaje = ''

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

		// ✅ recargar lista SIN refresh de página
		await cargarUsuarios()

		// limpiar formulario
		email = ''
		password = ''
		nombre = ''
		rol = 'viewer'

		mensaje = '✅ Usuario creado'
	}

	/* =========================
	   UPDATE USER
	========================= */

	async function guardar(u: Usuario) {
		const res = await fetch(`/api/admin/users/${u.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: u.nombre,
				rol: u.rol
			})
		})

		const data = await res.json()

		if (data.error) {
			alert(data.error)
		} else {
			alert('✅ Usuario actualizado')
		}
	}

	/* =========================
	   DELETE USER
	========================= */

	async function eliminar(id: string) {
		if (!confirm('¿Eliminar usuario?')) return

		const res = await fetch(`/api/admin/users/${id}`, {
			method: 'DELETE'
		})

		const data = await res.json()

		if (data.error) {
			alert(data.error)
			return
		}

		// ✅ eliminar del estado sin recargar
		usuarios = usuarios.filter(u => u.id !== id)
	}


	async function resetPassword(u: Usuario) {
	const nueva = prompt(`Nueva contraseña para ${u.email}`)

	if (!nueva) return

	const res = await fetch(`/api/admin/users/${u.id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password: nueva })
	})

	const data = await res.json()

	if (data.error) {
		alert(data.error)
	} else {
		alert('🔑 Contraseña actualizada')
	}
	}
</script>

<!-- =========================
     UI
========================= -->

<h2 class="text-xl font-bold mb-4">👥 Panel de Usuarios</h2>

<!-- =========================
     CREAR USUARIO
========================= -->

<div class="mb-6 space-y-2">
	<input
		class="border p-2 block"
		placeholder="Email"
		bind:value={email}
	/>

	<input
		class="border p-2 block"
		type="password"
		placeholder="Password"
		bind:value={password}
	/>

	<input
		class="border p-2 block"
		placeholder="Nombre"
		bind:value={nombre}
	/>

	<select class="border p-2" bind:value={rol}>
		<option value="usuario">viewer</option>
		<option value="operador">operador</option>
		<option value="admin">admin</option>
	</select>

	<button
		class="bg-blue-600 text-white px-3 py-2"
		onclick={crear}
	>
		Crear usuario
	</button>

	<p>{mensaje}</p>
</div>

<hr class="my-4" />

<!-- =========================
     LISTADO
========================= -->

{#if cargando}
	<p>Cargando usuarios...</p>

{:else}
	<table class="w-full border">
		<thead>
			<tr class="bg-gray-100">
				<th>Email</th>
				<th>Nombre</th>
				<th>Rol</th>
				<th>Acciones</th>
			</tr>
		</thead>

		<tbody>
			{#each usuarios as u (u.id)}
				<tr class="border-t">

					<!-- EMAIL -->
					<td>{u.email}</td>

					<!-- NOMBRE EDITABLE -->
					<td>
						<input
							class="border p-1"
							bind:value={u.nombre}
						/>
					</td>

					<!-- ROL EDITABLE -->
					<td>
						<select
							class="border p-1"
							bind:value={u.rol}
						>
							<option value="viewer">viewer</option>
							<option value="operador">operador</option>
							<option value="admin">admin</option>
						</select>
					</td>

					<!-- ACCIONES -->
				<td class="space-x-2">

					<button
						class="bg-green-600 text-white px-2 py-1"
						onclick={() => guardar(u)}
					>
						Guardar
					</button>

					<button
						class="bg-yellow-500 text-white px-2 py-1"
						onclick={() => resetPassword(u)}
					>
						Reset Pass
					</button>

					<button
						class="bg-red-600 text-white px-2 py-1"
						onclick={() => eliminar(u.id)}
					>
						Eliminar
					</button>

				</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}