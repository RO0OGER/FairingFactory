import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
})
export class ContactForm {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  readonly bikeModels = [
    'Kawasaki ZX-6R',
    'Yamaha YZF-R6',
    'Honda CBR600RR',
    'Suzuki GSX-R600',
    'Anderes Modell',
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    bike_model: [''],
    fairing_interest: [''],
    message: [''],
    newsletter: [false],
  });

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.supabase.submitLead({
      name: this.form.value.name!,
      email: this.form.value.email!,
      phone: this.form.value.phone || undefined,
      bike_model: this.form.value.bike_model || undefined,
      fairing_interest: this.form.value.fairing_interest || undefined,
      message: this.form.value.message || undefined,
      newsletter: this.form.value.newsletter ?? false,
    });

    this.loading.set(false);
    if (error) {
      this.error.set('Es ist ein Fehler aufgetreten. Bitte versuche es erneut.');
    } else {
      this.success.set(true);
      this.form.reset();
    }
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control.touched);
  }
}
