/**
 * =========================================
 * 🔐 LOGOUT GLOBAL
 * -----------------------------------------
 * - Cierra sesión en Supabase
 * - Limpia estado local y SSR
 * - Redirige a login
 * =========================================
 */

import { supabase } from '$lib/supabase';
import { goto, invalidateAll } from '$app/navigation';

/** Cierra la sesión local y vuelve al acceso público. */
export async function logout(): Promise<void> {
	try {
		// 🔴 Cerrar sesión en Supabase (local + cookies)
		await supabase.auth.signOut();

		// 🔄 Forzar recarga de todos los load()
		await invalidateAll();

		// 🔁 Redirigir al login
		await goto('/login', { invalidateAll: true });
	} catch (error) {
		console.error('Error en logout:', error);
	}
}
