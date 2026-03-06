import { Injectable, computed, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);

  readonly currentUser = signal<User | null>(null);
  readonly authLoading = signal(true);
  readonly showAuthModal = signal(false);
  readonly isAdmin = computed(() => this.currentUser()?.user_metadata?.['is_admin'] === true);

  constructor() {
    this.supabase.client.auth.getSession().then(({ data: { session } }) => {
      this.currentUser.set(session?.user ?? null);
      this.authLoading.set(false);
    });

    this.supabase.client.auth.onAuthStateChange((_, session) => {
      this.currentUser.set(session?.user ?? null);
      this.authLoading.set(false);
    });
  }

  signUp(email: string, password: string) {
    return this.supabase.client.auth.signUp({ email, password });
  }

  signIn(email: string, password: string) {
    return this.supabase.client.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return this.supabase.client.auth.signOut();
  }
}
