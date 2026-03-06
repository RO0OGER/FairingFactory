import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

type Tab = 'login' | 'register';

@Component({
  selector: 'app-auth-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css',
})
export class AuthModal {
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly activeTab = signal<Tab>('login');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly registerSuccess = signal(false);

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
  }

  close() {
    this.auth.showAuthModal.set(false);
    this.error.set(null);
    this.registerSuccess.set(false);
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
      if (error.message.toLowerCase().includes('email not confirmed')) {
        this.error.set('Bitte bestätige zuerst deine E-Mail-Adresse (Link im Posteingang).');
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        this.error.set('E-Mail oder Passwort ist falsch.');
      } else {
        this.error.set(error.message);
      }
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
      this.registerSuccess.set(true);
    }
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
