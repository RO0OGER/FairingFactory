import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../services/auth.service';
import { ChatService, Conversation, Message } from '../../services/chat.service';
import { CommunityPhoto, CommunityService } from '../../services/community.service';
import { MotorcycleService } from '../../services/motorcycle.service';
import { Product, ProductInput, ProductService } from '../../services/product.service';
import { AdminUser, UserManagementService } from '../../services/user-management.service';

const GALLERY_SIZE = 4;

@Component({
  selector: 'app-admin-page',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, DecimalPipe, DatePipe],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPage implements OnInit, OnDestroy {
  protected auth = inject(AuthService);
  private productService = inject(ProductService);
  private chatService = inject(ChatService);
  private communityService = inject(CommunityService);
  protected moto = inject(MotorcycleService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // ── Tab navigation ──────────────────────────────
  readonly activeTab = signal<'products' | 'messages' | 'community' | 'users'>('products');

  // ── Products ────────────────────────────────────
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deleteConfirmId = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly formError = signal<string | null>(null);

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  currentImageUrl: string | null = null;

  galleryFiles: (File | null)[] = Array(GALLERY_SIZE).fill(null);
  galleryPreviews: (string | null)[] = Array(GALLERY_SIZE).fill(null);
  currentGalleryImages: (string | null)[] = Array(GALLERY_SIZE).fill(null);

  // Year tags (multi-year input)
  yearTags: string[] = [];
  newYearInput = '';

  // Product make/model selectors (replace free-text model field)
  readonly productModels = signal<string[]>([]);
  readonly productModelsLoading = signal(false);
  productMake = '';
  productModelSelected = '';

  readonly form = this.fb.group({
    model: ['', Validators.required],
    years: ['', Validators.required],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    description: [''],
    available: [true],
  });

  // ── Community ───────────────────────────────────
  readonly pendingPhotos = signal<CommunityPhoto[]>([]);
  readonly approvedPhotos = signal<CommunityPhoto[]>([]);
  readonly communityLoading = signal(false);

  async loadPendingPhotos() {
    this.communityLoading.set(true);
    const [pending, approved] = await Promise.all([
      this.communityService.getPendingPhotos(),
      this.communityService.getAdminApprovedPhotos(),
    ]);
    this.pendingPhotos.set((pending.data ?? []) as CommunityPhoto[]);
    this.approvedPhotos.set((approved.data ?? []) as CommunityPhoto[]);
    this.communityLoading.set(false);
  }

  async approvePhoto(id: string) {
    await this.communityService.approvePhoto(id);
    const photo = this.pendingPhotos().find((p) => p.id === id);
    this.pendingPhotos.update((list) => list.filter((p) => p.id !== id));
    if (photo) this.approvedPhotos.update((list) => [{ ...photo, approved: true }, ...list]);
  }

  async rejectPhoto(id: string) {
    await this.communityService.rejectPhoto(id);
    this.pendingPhotos.update((list) => list.filter((p) => p.id !== id));
  }

  async deleteApprovedPhoto(id: string) {
    await this.communityService.deletePhoto(id);
    this.approvedPhotos.update((list) => list.filter((p) => p.id !== id));
  }

  // ── Messages ────────────────────────────────────
  readonly conversations = signal<Conversation[]>([]);
  readonly messagesLoading = signal(false);
  readonly selectedConv = signal<Conversation | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly replyText = signal('');
  readonly sendingReply = signal(false);

  private msgChannel: RealtimeChannel | null = null;
  private convChannel: RealtimeChannel | null = null;

  readonly adminMakes = signal<string[]>([]);

  // ── Users ────────────────────────────────────────
  private userService = inject(UserManagementService);
  readonly users = signal<AdminUser[]>([]);
  readonly usersLoading = signal(false);
  readonly deleteUserConfirmId = signal<string | null>(null);
  readonly deletingUser = signal(false);
  readonly togglingAdminId = signal<string | null>(null);

  async ngOnInit() {
    if (!this.auth.authLoading() && !this.auth.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    await this.loadProducts();
    await this.loadConversations();
    await this.loadPendingPhotos();
    this.subscribeToNewConversations();
    const makes = await this.moto.getMakes();
    this.adminMakes.set(makes);
  }

  private async parseAndLoadProductMakeModel(modelString: string) {
    const makes = this.adminMakes();
    if (!makes.length || !modelString) return;
    // Find make by checking if the model string starts with a known make (longest match wins)
    const sorted = [...makes].sort((a, b) => b.length - a.length);
    const make = sorted.find((m) => modelString.toLowerCase().startsWith(m.toLowerCase()));
    if (!make) return;
    this.productMake = make;
    this.productModelsLoading.set(true);
    const models = await this.moto.getModels(make);
    this.productModels.set(models);
    this.productModelsLoading.set(false);
    const rest = modelString.slice(make.length).trim();
    if (models.includes(rest)) {
      this.productModelSelected = rest;
    }
  }

  async onProductMakeChange() {
    this.productModelSelected = '';
    this.productModels.set([]);
    this.form.get('model')?.setValue('');
    if (!this.productMake) return;
    this.productModelsLoading.set(true);
    const models = await this.moto.getModels(this.productMake);
    this.productModels.set(models);
    this.productModelsLoading.set(false);
  }

  onProductModelChange() {
    if (this.productMake && this.productModelSelected) {
      this.form.get('model')?.setValue(`${this.productMake} ${this.productModelSelected}`);
    }
  }

  addYearTag() {
    const val = this.newYearInput.trim();
    if (!val || this.yearTags.includes(val)) return;
    this.yearTags = [...this.yearTags, val];
    this.newYearInput = '';
    this.form.get('years')?.setValue(this.yearTags.join(', '));
  }

  removeYearTag(index: number) {
    this.yearTags = this.yearTags.filter((_, i) => i !== index);
    this.form.get('years')?.setValue(this.yearTags.join(', '));
  }

  onYearInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addYearTag();
    }
  }

  ngOnDestroy() {
    this.msgChannel?.unsubscribe();
    this.convChannel?.unsubscribe();
  }

  // ── Products ────────────────────────────────────
  private async loadProducts() {
    const { data } = await this.productService.getProducts();
    if (data) this.products.set(data as Product[]);
    this.loading.set(false);
  }

  openNew() {
    this.form.reset({ available: true });
    this.selectedFile = null;
    this.previewUrl = null;
    this.currentImageUrl = null;
    this.galleryFiles = Array(GALLERY_SIZE).fill(null);
    this.galleryPreviews = Array(GALLERY_SIZE).fill(null);
    this.currentGalleryImages = Array(GALLERY_SIZE).fill(null);
    this.yearTags = [];
    this.newYearInput = '';
    this.productMake = '';
    this.productModelSelected = '';
    this.productModels.set([]);
    this.formError.set(null);
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(product: Product) {
    this.form.patchValue({
      model: product.model,
      years: product.years,
      price: product.price,
      description: product.description,
      available: product.available,
    });
    this.selectedFile = null;
    this.previewUrl = null;
    this.currentImageUrl = product.image_url;
    const gallery = product.gallery_images ?? [];
    this.galleryFiles = Array(GALLERY_SIZE).fill(null);
    this.galleryPreviews = Array(GALLERY_SIZE).fill(null);
    this.currentGalleryImages = Array.from({ length: GALLERY_SIZE }, (_, i) => gallery[i] ?? null);
    this.yearTags = product.years ? product.years.split(',').map((s) => s.trim()).filter(Boolean) : [];
    this.newYearInput = '';
    // Pre-populate product make/model selectors from existing model string
    this.productMake = '';
    this.productModelSelected = '';
    this.productModels.set([]);
    this.parseAndLoadProductMakeModel(product.model);
    this.formError.set(null);
    this.editingId.set(product.id);
    this.showForm.set(true);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  onGalleryFileSelected(event: Event, index: number) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (this.galleryPreviews[index]) URL.revokeObjectURL(this.galleryPreviews[index]!);
    this.galleryFiles[index] = file;
    this.galleryPreviews[index] = URL.createObjectURL(file);
  }

  removeGalleryImage(index: number) {
    if (this.galleryPreviews[index]) URL.revokeObjectURL(this.galleryPreviews[index]!);
    this.galleryFiles[index] = null;
    this.galleryPreviews[index] = null;
    this.currentGalleryImages[index] = null;
  }

  galleryPreviewAt(index: number): string | null {
    return this.galleryPreviews[index] ?? this.currentGalleryImages[index];
  }

  closeForm() {
    this.showForm.set(false);
    this.selectedFile = null;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.galleryPreviews.forEach((p) => { if (p) URL.revokeObjectURL(p); });
    this.galleryFiles = Array(GALLERY_SIZE).fill(null);
    this.galleryPreviews = Array(GALLERY_SIZE).fill(null);
    this.currentGalleryImages = Array(GALLERY_SIZE).fill(null);
    this.yearTags = [];
    this.newYearInput = '';
    this.formError.set(null);
    this.form.reset();
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set(null);

    let imageUrl = this.currentImageUrl;
    if (this.selectedFile) {
      imageUrl = await this.productService.uploadImage(this.selectedFile);
      if (!imageUrl) {
        this.formError.set('Bild-Upload fehlgeschlagen. Bitte erneut versuchen.');
        this.saving.set(false);
        return;
      }
    }

    const uploadedGallery = await this.productService.uploadGalleryImages(this.galleryFiles);
    const finalGallery: string[] = this.currentGalleryImages.map((current, i) => {
      return uploadedGallery[i] ?? current ?? '';
    }).filter(Boolean);

    const data: ProductInput = {
      model: this.form.value.model!,
      years: this.form.value.years!,
      price: this.form.value.price!,
      description: this.form.value.description ?? '',
      available: this.form.value.available ?? true,
      image_url: imageUrl,
      gallery_images: finalGallery,
    };

    const id = this.editingId();
    if (id) {
      const { data: updated, error } = await this.productService.updateProduct(id, data);
      if (error) {
        this.formError.set('Speichern fehlgeschlagen.');
      } else if (updated) {
        this.products.update((list) => list.map((p) => (p.id === id ? (updated as Product) : p)));
        this.closeForm();
      }
    } else {
      const { data: created, error } = await this.productService.createProduct(data);
      if (error) {
        this.formError.set('Erstellen fehlgeschlagen.');
      } else if (created) {
        this.products.update((list) => [...list, created as Product]);
        this.closeForm();
      }
    }

    this.saving.set(false);
  }

  confirmDelete(id: string) {
    this.deleteConfirmId.set(id);
  }

  cancelDelete() {
    this.deleteConfirmId.set(null);
  }

  async deleteProduct(id: string) {
    this.deleting.set(true);
    const { error } = await this.productService.deleteProduct(id);
    if (!error) {
      this.products.update((list) => list.filter((p) => p.id !== id));
    }
    this.deleteConfirmId.set(null);
    this.deleting.set(false);
  }

  // ── Messages ────────────────────────────────────
  private async loadConversations() {
    const data = await this.chatService.getAllConversations();
    this.conversations.set(data);
  }

  private subscribeToNewConversations() {
    this.convChannel = this.chatService.subscribeToConversations(() => {
      this.loadConversations();
    });
  }

  get selectedUserInitial(): string {
    const email = this.selectedConv()?.user_email ?? '';
    return email.charAt(0).toUpperCase();
  }

  async openConversation(conv: Conversation) {
    this.selectedConv.set(conv);
    this.messagesLoading.set(true);
    const msgs = await this.chatService.getMessages(conv.id);
    this.messages.set(msgs);
    this.messagesLoading.set(false);
    await this.chatService.markMessagesRead(conv.id);
    this.conversations.update((list) =>
      list.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );
    this.scrollThreadToBottom();

    this.msgChannel?.unsubscribe();
    this.msgChannel = this.chatService.subscribeToMessages(conv.id, (msg) => {
      this.messages.update((list) =>
        list.some((m) => m.id === msg.id) ? list : [...list, msg]
      );
      if (!msg.is_from_admin) {
        this.chatService.markMessagesRead(conv.id);
      }
      this.scrollThreadToBottom();
    });
  }

  private scrollThreadToBottom() {
    setTimeout(() => {
      const el = document.querySelector('.conv-thread__messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  async sendReply() {
    const text = this.replyText().trim();
    const conv = this.selectedConv();
    if (!text || !conv) return;
    this.sendingReply.set(true);
    const msg = await this.chatService.sendMessage(conv.id, text, true);
    if (msg) {
      this.replyText.set('');
      await this.loadConversations();
    }
    this.sendingReply.set(false);
  }

  onReplyKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendReply();
    }
  }

  async loadUsers() {
    this.usersLoading.set(true);
    const data = await this.userService.getUsers();
    this.users.set(data);
    this.usersLoading.set(false);
  }

  confirmDeleteUser(id: string) {
    this.deleteUserConfirmId.set(id);
  }

  cancelDeleteUser() {
    this.deleteUserConfirmId.set(null);
  }

  async deleteUser(id: string) {
    this.deletingUser.set(true);
    const ok = await this.userService.deleteUser(id);
    if (ok) this.users.update((list) => list.filter((u) => u.id !== id));
    this.deleteUserConfirmId.set(null);
    this.deletingUser.set(false);
  }

  async toggleAdmin(user: AdminUser) {
    this.togglingAdminId.set(user.id);
    const ok = await this.userService.setAdminRole(user.id, !user.is_admin);
    if (ok) this.users.update((list) =>
      list.map((u) => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u)
    );
    this.togglingAdminId.set(null);
  }

  async signOut() {
    await this.auth.signOut();
    this.router.navigate(['/']);
  }
}
