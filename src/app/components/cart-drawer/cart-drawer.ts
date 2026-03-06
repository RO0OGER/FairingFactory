import { Component, inject } from '@angular/core';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css',
})
export class CartDrawer {
  protected cart = inject(CartService);

  close() {
    this.cart.showCartDrawer.set(false);
  }

  orderNow() {
    this.close();
    document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' });
  }
}
