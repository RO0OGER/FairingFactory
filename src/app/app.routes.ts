import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { AdminPage } from './components/admin/admin-page';
import { Impressum } from './components/impressum/impressum';
import { LandingPage } from './components/landing-page/landing-page';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'admin', component: AdminPage, canActivate: [adminGuard] },
  { path: 'impressum', component: Impressum },
  { path: '**', redirectTo: '' },
];
