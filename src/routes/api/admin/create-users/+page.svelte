<script lang="ts">
	let email = $state('');
	let password = $state('');
	let mensaje = $state('');

	async function crearUsuario() {
		const res = await fetch('/api/admin/create-user', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			//body: JSON.stringify({ email, password, nombre })
		});

		const data = await res.json();

		if (data.error) {
			mensaje = data.error;
		} else {
			mensaje = '✅ Usuario creado correctamente';
			email = '';
			password = '';
			//nombre = '';
		}
	}
</script>

<input bind:value={email} placeholder="Email" />
<input bind:value={password} type="password" placeholder="Password" />
<!-- <input bind:value={nombre} placeholder="Nombre" /> -->
<button onclick={crearUsuario}>
	Crear usuario
</button>

<p>{mensaje}</p>