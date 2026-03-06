import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { MotorcycleService } from '../../services/motorcycle.service';
import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-products',
  imports: [FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  protected moto = inject(MotorcycleService);
  private productService = inject(ProductService);
  private router = inject(Router);

  readonly products = signal<Product[]>([]);
  readonly loadingProducts = signal(true);
  readonly loadingModel = signal<string | null>(null);

  readonly filteredProducts = computed(() => {
    const bike = this.moto.activeBike();
    const all = this.products();
    if (!bike) return all;
    const makeLower = bike.make.toLowerCase();
    const modelLower = bike.model.toLowerCase();
    return all.filter((p) => {
      const productLower = p.model.toLowerCase();
      if (!productLower.startsWith(makeLower)) return false;
      const productModelPart = productLower.slice(makeLower.length).trim();
      // Bidirectional prefix match handles "ZX-6R" vs "ZX-6R 636" mismatches
      return productModelPart.startsWith(modelLower) || modelLower.startsWith(productModelPart);
    });
  });

  // Guest bike form (for non-logged-in users)
  readonly showGuestForm = signal(false);
  readonly guestMakes = signal<string[]>([]);
  readonly guestModels = signal<string[]>([]);
  readonly guestMakesLoading = signal(false);
  readonly guestModelsLoading = signal(false);
  guestMakeInput = '';
  guestModelInput = '';
  guestYearInput = '';

  constructor() {
    this.loadProducts();
  }

  private async loadProducts() {
    const { data } = await this.productService.getProducts();
    if (data) this.products.set(data as Product[]);
    this.loadingProducts.set(false);
  }

  async openGuestForm() {
    this.showGuestForm.set(true);
    if (this.guestMakes().length === 0) {
      this.guestMakesLoading.set(true);
      const makes = await this.moto.getMakes();
      this.guestMakes.set(makes);
      this.guestMakesLoading.set(false);
    }
  }

  async onGuestMakeChange() {
    this.guestModelInput = '';
    this.guestModels.set([]);
    if (!this.guestMakeInput) return;
    this.guestModelsLoading.set(true);
    const models = await this.moto.getModels(this.guestMakeInput);
    this.guestModels.set(models);
    this.guestModelsLoading.set(false);
  }

  saveGuestBike() {
    if (!this.guestMakeInput || !this.guestModelInput) return;
    const year = this.guestYearInput ? parseInt(this.guestYearInput, 10) : null;
    this.moto.setGuestBike(this.guestMakeInput, this.guestModelInput, year);
    this.showGuestForm.set(false);
    this.guestMakeInput = '';
    this.guestModelInput = '';
    this.guestYearInput = '';
  }

  async onCartClick(product: Product) {
    if (!this.auth.currentUser()) {
      this.auth.showAuthModal.set(true);
      return;
    }
    if (this.cart.isInCart(product.model)) {
      this.cart.showCartDrawer.set(true);
      return;
    }
    this.loadingModel.set(product.model);
    await this.cart.addItem(product.model, product.price);
    this.loadingModel.set(null);
  }

  goToDetail(product: Product) {
    this.router.navigate(['/products', product.id]);
  }
}
