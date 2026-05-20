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

export async function logout() {
  try {
    // 🔴 Cerrar sesión en Supabase (local + cookies)
    await supabase.auth.signOut();

    // 🔄 Forzar recarga de todos los load()
    await invalidateAll();

    // 🔁 Redirigir al login
    await goto('/login');

  } catch (error) {
    console.error('Error en logout:', error);
  }
}