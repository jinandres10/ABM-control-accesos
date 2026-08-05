// See https://kit.svelte.dev/docs/types#app
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Perfil } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			session: Session | null;
			user: User | null;
			perfil: Perfil | null;
		}

		interface PageData {
			session: Session | null;
			user: User | null;
			perfil: Perfil | null;
		}
	}
}

export {};
