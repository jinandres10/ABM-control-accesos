/**
 * =====================================================
 * LAYOUT UNIVERSAL
 * -----------------------------------------------------
 * Sincroniza:
 * - Supabase Auth
 * - Browser session
 * - SSR session
 * - Refresh token
 *
 * ⚠️ ESTE ARCHIVO ES OBLIGATORIO
 * para que hooks.server.ts pueda
 * leer la sesión correctamente.
 * =====================================================
 */

import { supabase } from '$lib/supabase';

import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {

  /* =============================
     Obtener sesión actual
  ============================== */
  const {
    data: { session }
  } = await supabase.auth.getSession();

  /* =============================
     Obtener usuario autenticado
  ============================== */
  const {
    data: { user }
  } = await supabase.auth.getUser();

  /* =============================
     Devolver al layout SSR
  ============================== */
  return {
    session,
    user
  };
};