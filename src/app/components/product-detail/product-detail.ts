import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CommunityPhoto, CommunityService } from '../../services/community.service';
import { GarageModal } from '../garage-modal/garage-modal';
import { AuthModal } from '../auth-modal/auth-modal';
import { CartDrawer } from '../cart-drawer/cart-drawer';
import { PhotoLightbox } from '../photo-lightbox/photo-lightbox';
import { MotorcycleService } from '../../services/motorcycle.service';
import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, DecimalPipe, GarageModal, AuthModal, CartDrawer, PhotoLightbox],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  protected moto = inject(MotorcycleService);
  private productService = inject(ProductService);
  private communityService = inject(CommunityService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly addingToCart = signal(false);
  readonly activeGalleryIndex = signal(0);
  readonly communityPhotos = signal<CommunityPhoto[]>([]);
  readonly selectedPhoto = signal<CommunityPhoto | null>(null);

  readonly currentYear = new Date().getFullYear();

  readonly allImages = computed(() => {
    const p = this.product();
    if (!p) return [];
    const imgs = (p.gallery_images ?? []).filter(Boolean);
    return p.image_url ? [p.image_url, ...imgs] : imgs;
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }
    const { data } = await this.productService.getProductById(id);
    if (!data) { this.router.navigate(['/']); return; }
    this.product.set(data as Product);
    this.loading.set(false);
    // Load community photos in background
    const { data: photos } = await this.communityService.getApprovedPhotos();
    if (photos) this.communityPhotos.set(photos as CommunityPhoto[]);
  }

  async onCartClick() {
    const p = this.product();
    if (!p) return;
    if (!this.auth.currentUser()) {
      this.auth.showAuthModal.set(true);
      return;
    }
    if (this.cart.isInCart(p.model)) {
      this.cart.showCartDrawer.set(true);
      return;
    }
    this.addingToCart.set(true);
    await this.cart.addItem(p.model, p.price);
    this.addingToCart.set(false);
  }

  async signOut() {
    await this.auth.signOut();
  }
}
