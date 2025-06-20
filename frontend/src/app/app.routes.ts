import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductsComponent } from './products/products.component';
import { CartComponent } from './cart/cart.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'products', component: ProductsComponent, canActivate: [AuthGuard] },
    { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
    { path: '', redirectTo: '/products', pathMatch: 'full' }
];
