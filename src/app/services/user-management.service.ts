import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private supabase = inject(SupabaseService);

  async getUsers(): Promise<AdminUser[]> {
    const { data, error } = await this.supabase.client.rpc('get_users_for_admin');
    if (error || !data) return [];
    return data as AdminUser[];
  }

  async deleteUser(userId: string): Promise<boolean> {
    const { error } = await this.supabase.client.rpc('delete_user_by_admin', {
      target_user_id: userId,
    });
    return !error;
  }

  async setAdminRole(userId: string, makeAdmin: boolean): Promise<boolean> {
    const { error } = await this.supabase.client.rpc('set_user_admin_role', {
      target_user_id: userId,
      make_admin: makeAdmin,
    });
    return !error;
  }
}
