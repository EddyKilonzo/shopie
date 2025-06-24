import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @Input() isLandingPage = false;
  
  currentUser: any = null;
  cartItemCount = 0;
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'ADMIN';
      
      /**
       * This method is used to get the cart items for non-admin users
       */
      if (!this.isAdmin) {
        this.cartService.cartItems$.subscribe(items => {
          this.cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        });
      } else {
        // Set cart count to 0 for admin users
        this.cartItemCount = 0;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
} 