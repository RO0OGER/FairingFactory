import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Lead {
  name: string;
  email: string;
  phone?: string;
  bike_model?: string;
  fairing_interest?: string;
  message?: string;
  newsletter: boolean;
}

export interface Feedback {
  email?: string;
  rating: number;
  would_buy: boolean;
  price_ok: boolean;
  swiss_quality_important: boolean;
  free_text?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabase.url,
    environment.supabase.anonKey,
  );

  submitLead(data: Lead) {
    return this.client.from('leads').insert([data]);
  }

  submitFeedback(data: Feedback) {
    return this.client.from('feedback').insert([data]);
  }
}