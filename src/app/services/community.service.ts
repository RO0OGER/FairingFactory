import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface CommunityPhoto {
  id: string;
  created_at: string;
  user_id: string | null;
  user_name: string;
  bike_model: string | null;
  social_media_tag: string | null;
  photo_url: string;
  approved: boolean;
}

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private supabase = inject(SupabaseService);

  getApprovedPhotos() {
    return this.supabase.client
      .from('community_photos')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });
  }

  getPendingPhotos() {
    return this.supabase.client
      .from('community_photos')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false });
  }

  async uploadPhoto(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}.${ext}`;
    const { data, error } = await this.supabase.client.storage
      .from('community')
      .upload(filename, file, { upsert: false, contentType: file.type });
    if (error || !data) return null;
    return this.supabase.client.storage.from('community').getPublicUrl(data.path).data.publicUrl;
  }

  async submitPhoto(userName: string, bikeModel: string, socialTag: string, file: File): Promise<boolean> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    const photoUrl = await this.uploadPhoto(file);
    if (!photoUrl) return false;

    const { error } = await this.supabase.client
      .from('community_photos')
      .insert({
        user_id: user?.id ?? null,
        user_name: userName,
        bike_model: bikeModel || null,
        social_media_tag: socialTag || null,
        photo_url: photoUrl,
        approved: false,
      });

    return !error;
  }

  approvePhoto(id: string) {
    return this.supabase.client
      .from('community_photos')
      .update({ approved: true })
      .eq('id', id);
  }

  rejectPhoto(id: string) {
    return this.supabase.client
      .from('community_photos')
      .delete()
      .eq('id', id);
  }

  deletePhoto(id: string) {
    return this.supabase.client
      .from('community_photos')
      .delete()
      .eq('id', id);
  }

  getAdminApprovedPhotos() {
    return this.supabase.client
      .from('community_photos')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });
  }
}
