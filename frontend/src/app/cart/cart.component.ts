import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  isLoading = false;
  errorMessage = '';
  cartTotal = 0;
  totalItems = 0;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  /**
   * Loads the cart
   */
  loadCart(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.cartService.getCartItems().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cartItems = response.data;
          this.calculateTotals();
        } else {
          this.errorMessage = response.message || 'Failed to load cart';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.errorMessage = 'Failed to load cart. Please try again.';
        this.isLoading = false;
      }
    });
  }

  calculateTotals(): void {
    this.cartTotal = this.cartItems.reduce((sum, item) => sum + Number(item.total), 0);
    this.totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Removes an item from the cart
   * @param itemId - The ID of the item to remove
   */
  removeFromCart(itemId: string): void {
    this.cartService.removeFromCart(itemId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Item removed from cart');
          this.loadCart(); // Reload cart to update totals
        } else {
          this.toastService.error(response.message || 'Failed to remove item');
        }
      },
      error: (error) => {
        console.error('Error removing from cart:', error);
        this.toastService.error('Failed to remove item. Please try again.');
      }
    });
  }

  /**
   * Logs out the user
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 