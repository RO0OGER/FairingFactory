import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.authLoading()) {
    // Auth hasn't resolved yet – allow through and let AdminPage handle it
    return true;
  }

  if (auth.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
