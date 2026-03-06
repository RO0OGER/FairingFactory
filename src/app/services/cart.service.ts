import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export interface CartItem {
  id: string;
  product_model: string;
  quantity: number;
  price_at_add: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  readonly cartItems = signal<CartItem[]>([]);
  readonly showCartDrawer = signal(false);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.loadCart();
      } else {
        this.cartItems.set([]);
      }
    });
  }

  get itemCount(): number {
    return this.cartItems().reduce((sum, i) => sum + i.quantity, 0);
  }

  get total(): number {
    return this.cartItems().reduce((sum, i) => sum + i.price_at_add * i.quantity, 0);
  }

  isInCart(productModel: string): boolean {
    return this.cartItems().some((i) => i.product_model === productModel);
  }

  async addItem(productModel: string, price: number): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const existing = this.cartItems().find((i) => i.product_model === productModel);
    if (existing) {
      await this.updateQuantity(existing.id, existing.quantity + 1);
      return;
    }

    const { data, error } = await this.supabase.client
      .from('cart_items')
      .insert([{ user_id: userId, product_model: productModel, price_at_add: price, quantity: 1 }])
      .select()
      .single();

    if (!error && data) {
      this.cartItems.update((items) => [...items, data as CartItem]);
    }
  }

  async removeItem(cartItemId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (!error) {
      this.cartItems.update((items) => items.filter((i) => i.id !== cartItemId));
    }
  }

  async updateQuantity(cartItemId: string, quantity: number): Promise<void> {
    if (quantity < 1) {
      await this.removeItem(cartItemId);
      return;
    }

    const { error } = await this.supabase.client
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId);

    if (!error) {
      this.cartItems.update((items) =>
        items.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)),
      );
    }
  }

  private async loadCart(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('cart_items')
      .select('*')
      .order('created_at');

    if (!error && data) {
      this.cartItems.set(data as CartItem[]);
    }
  }
}
