import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthModal } from '../auth-modal/auth-modal';
import { CartDrawer } from '../cart-drawer/cart-drawer';
import { GarageModal } from '../garage-modal/garage-modal';
import { PhotoLightbox } from '../photo-lightbox/photo-lightbox';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CommunityPhoto, CommunityService } from '../../services/community.service';
import { MotorcycleService } from '../../services/motorcycle.service';

@Component({
  selector: 'app-community',
  imports: [RouterLink, FormsModule, AuthModal, CartDrawer, GarageModal, PhotoLightbox],
  templateUrl: './community.html',
  styleUrl: './community.css',
})
export class Community implements OnInit {
  private communityService = inject(CommunityService);
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  protected moto = inject(MotorcycleService);

  readonly photos = signal<CommunityPhoto[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly uploading = signal(false);
  readonly uploadSuccess = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly selectedPhoto = signal<CommunityPhoto | null>(null);

  userName = '';
  selectedGarageBike = '';
  socialTag = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  async ngOnInit() {
    const { data } = await this.communityService.getApprovedPhotos();
    this.photos.set((data ?? []) as CommunityPhoto[]);
    this.loading.set(false);
  }

  openForm() {
    if (!this.auth.currentUser()) {
      this.auth.showAuthModal.set(true);
      return;
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.uploadSuccess.set(false);
    this.uploadError.set(null);
    this.userName = '';
    this.selectedGarageBike = '';
    this.socialTag = '';
    this.selectedFile = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  get selectedBikeName(): string {
    const bike = this.moto.garage().find((b) => b.id === this.selectedGarageBike);
    return bike ? this.moto.bikeName(bike) : '';
  }

  async submit() {
    if (!this.userName.trim() || !this.selectedFile || !this.selectedGarageBike) {
      this.uploadError.set('Bitte Name, Motorrad und Foto angeben.');
      return;
    }
    this.uploading.set(true);
    this.uploadError.set(null);

    const ok = await this.communityService.submitPhoto(
      this.userName.trim(),
      this.selectedBikeName,
      this.socialTag.trim(),
      this.selectedFile,
    );

    this.uploading.set(false);
    if (ok) {
      this.uploadSuccess.set(true);
    } else {
      this.uploadError.set('Upload fehlgeschlagen. Bitte versuche es erneut.');
    }
  }

  async signOut() {
    await this.auth.signOut();
  }

  readonly currentYear = new Date().getFullYear();
}
