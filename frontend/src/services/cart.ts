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

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private loadCartItems(): void {
    // Only proceed if there's a valid token
    const token = localStorage.getItem('token');
    if (!token) {
      this.cartItemsSubject.next([]);
      return;
    }

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
      }
    });
  }

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

  getCartItems(): Observable<ApiResponse<CartItem[]>> {
    return this.http.get<ApiResponse<CartItem[]>>(`${this.apiUrl}`, {
      headers: this.getHeaders()
    });
  }

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

  refreshCart(): void {
    this.loadCartItems();
  }

  // Clear cart items when user switches (logout/login)
  clearCartItems(): void {
    this.cartItemsSubject.next([]);
  }
} 