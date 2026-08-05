<script lang="ts">
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/supabase';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let cargando = $state(false);

	/** Valida el estado del perfil y crea la sesión persistente del navegador. */
	async function login(): Promise<void> {
		error = '';
		if (!email.trim() || !password) {
			error = 'Completá el correo y la contraseña.';
			return;
		}

		cargando = true;
		try {
			const response = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), password })
			});
			const result: { error?: string } = await response.json().catch(() => ({}));
			if (!response.ok || result.error) {
				error = result.error ?? 'No fue posible iniciar sesión.';
				return;
			}

			const { error: signInError } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password
			});
			if (signInError) {
				error = 'No fue posible crear la sesión. Volvé a intentarlo.';
				return;
			}
			window.location.assign(resolve('/dashboard'));
		} catch {
			error = 'No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente.';
		} finally {
			cargando = false;
		}
	}
</script>

<div class="login-wrap">
	<form
		class="login-card"
		onsubmit={(event) => {
			event.preventDefault();
			login();
		}}
	>
		<h1>Control de accesos</h1>
		<p class="subtitle">Ingresá tus credenciales para continuar.</p>
		<label
			>Correo electrónico<input
				bind:value={email}
				type="email"
				autocomplete="email"
				required
			/></label
		>
		<label
			>Contraseña<input
				bind:value={password}
				type="password"
				autocomplete="current-password"
				required
			/></label
		>
		{#if error}<p class="error" role="alert">{error}</p>{/if}
		<button type="submit" disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button>
	</form>
</div>
