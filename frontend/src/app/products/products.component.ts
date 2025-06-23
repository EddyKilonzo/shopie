import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ProductsService, Product } from '../../services/products';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast';
import { NavbarComponent } from '../shared/navbar.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
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
  
  // Filter properties
  sortBy = 'name'; 
  
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

    // Filter by search term (name only)
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', filtered.length);
    }

    // Sort products
    filtered = this.sortProducts(filtered);

    console.log('Final filtered products:', filtered);
    return filtered;
  }

  sortProducts(products: Product[]): Product[] {
    return [...products].sort((a, b) => {
      switch (this.sortBy) {
        case 'price-low':
          return Number(a.price) - Number(b.price);
        case 'price-high':
          return Number(b.price) - Number(a.price);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  get categories(): string[] {
    return ['all'];
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.sortBy = 'name';
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/products', product.id]);
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
} 