import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export interface UserMotorcycle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number | null;
  is_active: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class MotorcycleService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  readonly garage = signal<UserMotorcycle[]>([]);
  readonly garageLoaded = signal(false);
  readonly showGarageModal = signal(false);
  readonly guestBike = signal<UserMotorcycle | null>(this.loadGuestBikeFromStorage());

  readonly activeBike = computed(() => {
    if (this.auth.currentUser()) {
      return this.garage().find((b) => b.is_active) ?? null;
    }
    return this.guestBike();
  });

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.loadGarage();
      } else {
        this.garage.set([]);
        this.garageLoaded.set(false);
      }
    });
  }

  private loadGuestBikeFromStorage(): UserMotorcycle | null {
    try {
      const raw = localStorage.getItem('ff_guest_bike');
      return raw ? (JSON.parse(raw) as UserMotorcycle) : null;
    } catch {
      return null;
    }
  }

  setGuestBike(make: string, model: string, year: number | null): void {
    const bike: UserMotorcycle = { id: 'guest', user_id: 'guest', make, model, year, is_active: true, created_at: '' };
    localStorage.setItem('ff_guest_bike', JSON.stringify(bike));
    this.guestBike.set(bike);
  }

  clearGuestBike(): void {
    localStorage.removeItem('ff_guest_bike');
    this.guestBike.set(null);
  }

  async loadGarage(): Promise<void> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (!user) return;
    const { data } = await this.supabase.client
      .from('user_motorcycles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    this.garage.set((data ?? []) as UserMotorcycle[]);
    this.garageLoaded.set(true);
  }

  async getMakes(): Promise<string[]> {
    try {
      const res = await fetch(
        'https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/motorcycle?format=json'
      );
      const data = await res.json();
      return (data.Results as { MakeName: string }[]).map((r) => r.MakeName).sort();
    } catch {
      return [];
    }
  }

  async getModels(make: string): Promise<string[]> {
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`
      );
      const data = await res.json();
      return (data.Results as { Model_Name: string }[]).map((r) => r.Model_Name).sort();
    } catch {
      return [];
    }
  }

  async addBike(make: string, model: string, year?: number): Promise<boolean> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (!user) return false;
    const { data, error } = await this.supabase.client
      .from('user_motorcycles')
      .insert({ user_id: user.id, make, model, year: year ?? null, is_active: false })
      .select()
      .single();
    if (!error && data) {
      this.garage.update((list) => [...list, data as UserMotorcycle]);
      return true;
    }
    return false;
  }

  async setActive(id: string): Promise<void> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (!user) return;
    await this.supabase.client
      .from('user_motorcycles')
      .update({ is_active: false })
      .eq('user_id', user.id);
    await this.supabase.client
      .from('user_motorcycles')
      .update({ is_active: true })
      .eq('id', id);
    this.garage.update((list) => list.map((b) => ({ ...b, is_active: b.id === id })));
  }

  async deactivateAll(): Promise<void> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (!user) return;
    await this.supabase.client
      .from('user_motorcycles')
      .update({ is_active: false })
      .eq('user_id', user.id);
    this.garage.update((list) => list.map((b) => ({ ...b, is_active: false })));
  }

  async removeBike(id: string): Promise<void> {
    await this.supabase.client.from('user_motorcycles').delete().eq('id', id);
    this.garage.update((list) => list.filter((b) => b.id !== id));
  }

  bikeName(bike: UserMotorcycle): string {
    return `${bike.make} ${bike.model}${bike.year ? ' ' + bike.year : ''}`;
  }
}
