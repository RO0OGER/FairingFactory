import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { AdminPage } from './components/admin/admin-page';
import { Community } from './components/community/community';
import { Impressum } from './components/impressum/impressum';
import { LandingPage } from './components/landing-page/landing-page';
import { ProductDetail } from './components/product-detail/product-detail';
import { ProductsPage } from './components/products-page/products-page';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'admin', component: AdminPage, canActivate: [adminGuard] },
  { path: 'community', component: Community },
  { path: 'impressum', component: Impressum },
  { path: 'products', component: ProductsPage },
  { path: 'products/:id', component: ProductDetail },
  { path: '**', redirectTo: '' },
];
