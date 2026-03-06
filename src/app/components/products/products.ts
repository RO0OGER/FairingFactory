import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  private productService = inject(ProductService);

  readonly products = signal<Product[]>([]);
  readonly loadingProducts = signal(true);
  readonly loadingModel = signal<string | null>(null);

  constructor() {
    this.loadProducts();
  }

  private async loadProducts() {
    const { data } = await this.productService.getProducts();
    if (data) this.products.set(data as Product[]);
    this.loadingProducts.set(false);
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
}
