import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthModal } from '../auth-modal/auth-modal';
import { CartDrawer } from '../cart-drawer/cart-drawer';
import { GarageModal } from '../garage-modal/garage-modal';
import { Products } from '../products/products';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { MotorcycleService } from '../../services/motorcycle.service';

@Component({
  selector: 'app-products-page',
  imports: [Products, AuthModal, CartDrawer, GarageModal, RouterLink],
  templateUrl: './products-page.html',
  styleUrl: './products-page.css',
})
export class ProductsPage {
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  protected moto = inject(MotorcycleService);

  readonly currentYear = new Date().getFullYear();

  async signOut() {
    await this.auth.signOut();
  }
}
