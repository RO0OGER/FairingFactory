import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-feedback-form',
  imports: [ReactiveFormsModule],
  templateUrl: './feedback-form.html',
  styleUrl: './feedback-form.css',
})
export class FeedbackForm {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  readonly ratings = [1, 2, 3, 4, 5];

  readonly form = this.fb.group({
    email: ['', [Validators.email]],
    rating: [null as number | null, [Validators.required]],
    would_buy: [false],
    price_ok: [false],
    swiss_quality_important: [false],
    free_text: [''],
  });

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.supabase.submitFeedback({
      email: this.form.value.email || undefined,
      rating: this.form.value.rating!,
      would_buy: this.form.value.would_buy ?? false,
      price_ok: this.form.value.price_ok ?? false,
      swiss_quality_important: this.form.value.swiss_quality_important ?? false,
      free_text: this.form.value.free_text || undefined,
    });

    this.loading.set(false);
    if (error) {
      this.error.set('Es ist ein Fehler aufgetreten. Bitte versuche es erneut.');
    } else {
      this.success.set(true);
      this.form.reset();
    }
  }
}
