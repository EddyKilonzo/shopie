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
   * Processes the checkout
   */
  processCheckout(): void {
    this.isProcessing = true;
    
    // Simulate payment processing
    setTimeout(() => {
      // In a real application, you would send this data to your backend
      console.log('Checkout data:', this.checkoutData);
      console.log('Order total:', this.cartTotal);
      
      // Simulate successful order
      this.toastService.success('Order placed successfully!');
      
      // Clear cart after successful order
      this.cartService.clearCart().subscribe({
        next: (response) => {
          if (response.success) {
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
            
            this.router.navigate(['/products']); // Redirect to products
          } else {
            this.toastService.error('Order placed but there was an issue clearing the cart.');
          }
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error clearing cart:', error);
          this.toastService.error('Order placed but there was an issue clearing the cart.');
          this.isProcessing = false;
        }
      });
    }, 2000); // Simulate 2-second processing time
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