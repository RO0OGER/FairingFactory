import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthModal } from '../auth-modal/auth-modal';
import { CartDrawer } from '../cart-drawer/cart-drawer';
import { ChatWidget } from '../chat-widget/chat-widget';
import { Hero } from '../hero/hero';
import { HowItWorks } from '../how-it-works/how-it-works';
import { Products } from '../products/products';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-landing-page',
  imports: [Hero, HowItWorks, Products, AuthModal, CartDrawer, ChatWidget, RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
  protected auth = inject(AuthService);
  protected cart = inject(CartService);

  readonly currentYear = new Date().getFullYear();

  async signOut() {
    await this.auth.signOut();
  }
}
