import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MotorcycleService } from '../../services/motorcycle.service';

type Tab = 'login' | 'register';

@Component({
  selector: 'app-auth-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css',
})
export class AuthModal {
  protected auth = inject(AuthService);
  protected moto = inject(MotorcycleService);
  private fb = inject(FormBuilder);

  readonly activeTab = signal<Tab>('login');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showGarageStep = signal(false);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    this.error.set(null);
    this.showGarageStep.set(false);
  }

  close() {
    this.auth.showAuthModal.set(false);
    this.showGarageStep.set(false);
    this.error.set(null);
    this.loginForm.reset();
    this.registerForm.reset();
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.auth.signIn(
      this.loginForm.value.email!,
      this.loginForm.value.password!,
    );

    this.loading.set(false);
    if (error) {
      this.error.set('E-Mail oder Passwort ist falsch.');
    } else {
      this.close();
    }
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.auth.signUp(
      this.registerForm.value.email!,
      this.registerForm.value.password!,
    );

    this.loading.set(false);
    if (error) {
      this.error.set('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
    } else {
      this.showGarageStep.set(true);
    }
  }

  goToGarage() {
    this.close();
    this.moto.showGarageModal.set(true);
  }

  isLoginInvalid(field: string): boolean {
    const c = this.loginForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  isRegisterInvalid(field: string): boolean {
    const c = this.registerForm.get(field);
    return !!(c?.invalid && c.touched);
  }
}
