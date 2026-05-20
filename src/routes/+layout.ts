/**
 * =====================================================
 * LAYOUT UNIVERSAL (CLIENT SIDE AUTH)
 * -----------------------------------------------------
 * Sincroniza:
 * - Supabase Auth (localStorage)
 * - Estado global del usuario
 *
 * ⚠️ IMPORTANTE:
 * - Esto corre en el cliente
 * - NO es protección SSR real
 * - Solo mantiene estado en la UI
 * =====================================================
 */

import { supabase } from '$lib/supabase';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {

  /* =============================
     1️⃣ Obtener sesión actual
     ============================= */
  const {
    data: { session }
  } = await supabase.auth.getSession();

  /* =============================
     2️⃣ Retornar datos globales
     - session incluye user
     - simplificamos lógica
     ============================= */
  return {
    session: session ?? null,
    user: session?.user ?? null
  };
};