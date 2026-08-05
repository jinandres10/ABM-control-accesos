<script lang="ts">
	import '../app.css';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { logout } from '$lib/auth';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data } = $props<{
		children: import('svelte').Snippet;
		data: LayoutData;
	}>();

	// Mantiene los datos SSR sincronizados cuando Supabase renueva o elimina la sesión.
	onMount(() => {
		const { data: listener } = supabase.auth.onAuthStateChange(() => {
			invalidateAll();
		});

		return () => listener.subscription.unsubscribe();
	});
</script>

{#if data.user}
	<header class="app-header">
		<a class="brand" href={resolve('/dashboard')}>Control de accesos</a>
		<button class="logout-btn" type="button" onclick={logout}>Cerrar sesión</button>
	</header>
{/if}

<main class:container={Boolean(data.user)} class="page">
	{@render children()}
</main>

<style>
	.app-header {
		min-height: var(--nav-height);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: max(0.75rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) 0.75rem
			max(1rem, env(safe-area-inset-left));
		background: var(--color-primary);
		box-shadow: var(--shadow-sm);
	}

	.brand {
		color: #fff;
		font-weight: 700;
		text-decoration: none;
	}

	.logout-btn {
		min-height: 44px;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.45);
		color: #fff;
	}
</style>
