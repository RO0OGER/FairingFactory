import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait until Supabase session check is complete
  if (auth.authLoading()) {
    await firstValueFrom(
      toObservable(auth.authLoading).pipe(filter((loading) => !loading)),
    );
  }

  return auth.isAdmin() ? true : router.createUrlTree(['/']);
};
