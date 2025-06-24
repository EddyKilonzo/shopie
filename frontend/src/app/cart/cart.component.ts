import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { NavbarComponent } from '../shared/navbar.component';

interface CheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  isLoading = false;
  errorMessage = '';
  cartTotal = 0;
  totalItems = 0;
  showCheckout = false;
  isProcessing = false;
  
  checkoutData: CheckoutData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  };

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.initializeCheckoutData();
  }

  /**
   * Initialize checkout data with user information if available
   */
  initializeCheckoutData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.checkoutData.email = currentUser.email;
      this.checkoutData.firstName = currentUser.name.split(' ')[0] || '';
      this.checkoutData.lastName = currentUser.name.split(' ').slice(1).join(' ') || '';
    }
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
        if (error.status === 403) {
          this.errorMessage = 'Admin users cannot access cart functionality. Please use a customer account to make purchases.';
        } else {
          this.errorMessage = 'Failed to load cart. Please try again.';
        }
        this.isLoading = false;
      }
    });
  }

  calculateTotals(): void {
    this.cartTotal = this.cartItems.reduce((sum, item) => sum + Number(item.total), 0);
    this.totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Shows the checkout form
   */
  showCheckoutForm(): void {
    this.showCheckout = true;
  }

  /**
   * Returns to cart view
   */
  backToCart(): void {
    this.showCheckout = false;
  }

  /**
   * Processes the checkout and sends order confirmation email
   */
  processCheckout(): void {
    if (this.cartItems.length === 0) {
      this.toastService.error('Your cart is empty');
      return;
    }

    this.isProcessing = true;
    
    // Call the actual checkout API that sends order confirmation email
    this.cartService.checkout().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.toastService.success(response.data.message);
          
          // Clear local cart data
          this.cartItems = [];
          this.cartTotal = 0;
          this.totalItems = 0;
          this.showCheckout = false;
          
          // Reset checkout form
          this.checkoutData = {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            zipCode: ''
          };
          
          // Reinitialize with user data if available
          this.initializeCheckoutData();
          
          // Show success message with order details
          const orderId = response.data.orderId;
          this.toastService.success(`Order #${orderId} placed successfully! Check your email for confirmation.`);
          
          // Redirect to products page after a short delay
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 3000);
        } else {
          this.toastService.error(response.message || 'Failed to process checkout');
        }
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error processing checkout:', error);
        this.toastService.error('Failed to process checkout. Please try again.');
        this.isProcessing = false;
      }
    });
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