/**
 * =========================================
 * CLIENTE SUPABASE BROWSER (SvelteKit SSR)
 * -----------------------------------------
 * - Mantiene sesión en navegador
 * - Compatible con hooks.server.ts
 * - Maneja refresh token automático
 * =========================================
 */

import { createBrowserClient } from '@supabase/ssr';

import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

/**
 * Cliente singleton del browser
 */
export const supabase = createBrowserClient(
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
);