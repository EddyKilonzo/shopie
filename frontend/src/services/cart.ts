import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CartItem {
  id: string;
  quantity: number;
  productName: string;
  total: number;
  productId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface CheckoutResponse {
  message: string;
  orderId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:3000/cart';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Only load cart items if there's a valid token
    const token = localStorage.getItem('token');
    if (token) {
      this.loadCartItems();
    }
  }
  /**
   * This method is used to get the headers for the cart items
   * @returns The headers for the cart items
   */

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  /**
   * This method is used to load the cart items
   * @returns The cart items
   */

  private loadCartItems(): void {
    // Only proceed if there's a valid token
    const token = localStorage.getItem('token');
    if (!token) {
      this.cartItemsSubject.next([]);
      return;
    }
    /**
     * This method is used to get the cart items
     * @returns The cart items
     */

    this.getCartItems().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cartItemsSubject.next(response.data);
        } else {
          // If there's an error, set empty array to avoid stale data
          this.cartItemsSubject.next([]);
        }
      },
      error: (error) => {
        console.error('Error loading cart items:', error);
        // Set empty array on error to avoid stale data
        this.cartItemsSubject.next([]);
        
        // If it's a 403 error (admin user), don't show error in console
        if (error.status !== 403) {
          console.error('Cart access error:', error);
        }
      }
    });
  }
  /**
   * This method is used to add a product to the cart
   * @param request - The request to add a product to the cart
   * @returns The cart item
   */

  addToCart(request: AddToCartRequest): Observable<ApiResponse<CartItem>> {
    return this.http.post<ApiResponse<CartItem>>(`${this.apiUrl}/add`, request, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.loadCartItems(); // Refresh cart items
        }
      })
    );
  }
  /**
   * This method is used to get the cart items
   * @returns The cart items
   */

  getCartItems(): Observable<ApiResponse<CartItem[]>> {
    return this.http.get<ApiResponse<CartItem[]>>(`${this.apiUrl}`, {
      headers: this.getHeaders()
    });
  }
  /**
   * This method is used to update the quantity of a product in the cart
   * @param itemId - The id of the item to update
   * @param quantity - The quantity to update the item to
   * @returns The cart item
   */
  updateCartItem(itemId: string, quantity: number): Observable<ApiResponse<CartItem>> {
    return this.http.put<ApiResponse<CartItem>>(`${this.apiUrl}/${itemId}`, { quantity }, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.loadCartItems(); // Refresh cart items
        }
      })
    );
  }
  /**
   * This method is used to remove a product from the cart
   * @param itemId - The id of the item to remove
   * @returns The cart item
   */
  removeFromCart(itemId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${itemId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.loadCartItems(); // Refresh cart items
        }
      })
    );
  }
  /**
   * This method is used to clear the cart
   * @returns The cart item
   */

  clearCart(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.loadCartItems(); // Refresh cart items to ensure consistency
        }
      })
    );
  }
  /**
   * This method is used to checkout the cart
   * @returns The checkout response
   */
  checkout(): Observable<ApiResponse<CheckoutResponse>> {
    return this.http.post<ApiResponse<CheckoutResponse>>(`${this.apiUrl}/checkout`, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          // Clear cart items after successful checkout
          this.cartItemsSubject.next([]);
        }
      })
    );
  }
  /**
   * This method is used to refresh the cart
   */

  refreshCart(): void {
    this.loadCartItems();
  }

  /**
   * This method is used to clear the cart items
   */
  clearCartItems(): void {
    this.cartItemsSubject.next([]);
  }
} 