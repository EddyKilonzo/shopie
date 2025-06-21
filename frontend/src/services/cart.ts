import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  addToCart(request: AddToCartRequest): Observable<ApiResponse<CartItem>> {
    return this.http.post<ApiResponse<CartItem>>(`${this.apiUrl}/add`, request, {
      headers: this.getHeaders()
    });
  }

  getCartItems(): Observable<ApiResponse<CartItem[]>> {
    return this.http.get<ApiResponse<CartItem[]>>(`${this.apiUrl}`, {
      headers: this.getHeaders()
    });
  }

  updateCartItem(itemId: string, quantity: number): Observable<ApiResponse<CartItem>> {
    return this.http.put<ApiResponse<CartItem>>(`${this.apiUrl}/${itemId}`, { quantity }, {
      headers: this.getHeaders()
    });
  }

  removeFromCart(itemId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${itemId}`, {
      headers: this.getHeaders()
    });
  }

  clearCart(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}`, {
      headers: this.getHeaders()
    });
  }
} 