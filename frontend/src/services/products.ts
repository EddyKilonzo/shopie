import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
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
export class ProductsService {
  private apiUrl = 'http://localhost:3000/products';

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl);
  }

  getProductById(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`);
  }

  searchProducts(query: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/search/${query}`);
  }
} 