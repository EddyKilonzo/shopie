import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ProductsService, Product } from '../../services/products';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  selectedCategory = 'all';
  currentUser: any = null;
  addingToCart: { [productId: string]: boolean } = {};
  cartItemCount = 0;
  quantities: { [productId: string]: number } = {};
  
  // Expose Math functions to template
  Math = Math;

  constructor(
    private authService: AuthService,
    private productsService: ProductsService,
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCurrentUser();
    this.loadCartCount();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadCartCount(): void {
    this.cartService.getCartItems().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cartItemCount = response.data.reduce((sum, item) => sum + item.quantity, 0);
        }
      },
      error: (error) => {
        console.error('Error loading cart count:', error);
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productsService.getAllProducts().subscribe({
      next: (response) => {
        console.log('Products API Response:', response);
        if (response.success && response.data) {
          this.products = response.data;
          console.log('Products loaded:', this.products);
          console.log('Number of products:', this.products.length);
        } else {
          this.errorMessage = response.message || 'Failed to load products';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Failed to load products. Please try again.';
        this.isLoading = false;
      }
    });
  }

  addToCart(product: Product): void {
    const quantity = this.quantities[product.id] || 1;
    if (product.stockQuantity === 0) {
      this.toastService.error('Product is out of stock!');
      return;
    }
    if (quantity < 1 || quantity > product.stockQuantity) {
      this.toastService.error('Invalid quantity selected!');
      return;
    }
    this.addingToCart[product.id] = true;
    this.cartService.addToCart({
      productId: product.id,
      quantity
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(`${product.name} added to cart!`);
          this.loadProducts();
          this.loadCartCount();
          this.quantities[product.id] = 1; // reset after add
        } else {
          this.toastService.error(response.message || 'Failed to add to cart');
        }
        this.addingToCart[product.id] = false;
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.toastService.error('Failed to add to cart. Please try again.');
        this.addingToCart[product.id] = false;
      }
    });
  }

  get filteredProducts(): Product[] {
    let filtered = this.products;
    console.log('Filtering products. Total products:', this.products.length);

    // Filter by search term
    if (this.searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      console.log('After search filter:', filtered.length);
    }

    console.log('Final filtered products:', filtered);
    return filtered;
  }

  get categories(): string[] {
    // Since backend doesn't have categories, we'll use a simple filter
    return ['all'];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getProductImage(product: Product): string {
    // Only show placeholder if imageUrl is null, undefined, or empty string
    if (!product.imageUrl || product.imageUrl.trim() === '') {
      return 'https://placehold.co/300x200/CCCCCC/666666?text=No+Image';
    }
    return product.imageUrl;
  }

  getStockStatus(product: Product): string {
    if (product.stockQuantity === 0) return 'Out of Stock';
    if (product.stockQuantity < 10) return `${product.stockQuantity} left`;
    return `${product.stockQuantity} in stock`;
  }

  isLowStock(product: Product): boolean {
    return product.stockQuantity < 10;
  }
} 