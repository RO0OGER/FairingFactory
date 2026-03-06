import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Product {
  id: string;
  model: string;
  years: string;
  price: number;
  description: string;
  image_url: string | null;
  gallery_images: string[];
  available: boolean;
  sort_order: number;
}

export type ProductInput = Omit<Product, 'id' | 'sort_order'> & { sort_order?: number };

@Injectable({ providedIn: 'root' })
export class ProductService {
  private supabase = inject(SupabaseService);

  getProducts() {
    return this.supabase.client.from('products').select('*').order('sort_order').order('created_at');
  }

  createProduct(data: ProductInput) {
    return this.supabase.client.from('products').insert([data]).select().single();
  }

  updateProduct(id: string, data: Partial<ProductInput>) {
    return this.supabase.client.from('products').update(data).eq('id', id).select().single();
  }

  deleteProduct(id: string) {
    return this.supabase.client.from('products').delete().eq('id', id);
  }

  async uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}.${ext}`;
    const { data, error } = await this.supabase.client.storage
      .from('products')
      .upload(filename, file, { upsert: true, contentType: file.type });

    if (error || !data) return null;
    return this.supabase.client.storage.from('products').getPublicUrl(data.path).data.publicUrl;
  }

  async uploadGalleryImages(files: (File | null)[]): Promise<(string | null)[]> {
    const results: (string | null)[] = [];
    for (const file of files) {
      if (!file) {
        results.push(null);
        continue;
      }
      const url = await this.uploadImage(file);
      results.push(url);
    }
    return results;
  }
}
