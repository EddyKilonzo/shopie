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
    this.loadCartItems();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private loadCartItems(): void {
    this.getCartItems().subscribe(response => {
      if (response.success && response.data) {
        this.cartItemsSubject.next(response.data);
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
          this.cartItemsSubject.next([]); // Clear cart items
        }
      })
    );
  }

  refreshCart(): void {
    this.loadCartItems();
  }
} 