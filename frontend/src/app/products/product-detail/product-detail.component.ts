import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ProductsService, Product } from '../../../services/products';
import { CartService } from '../../../services/cart';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  isLoading = false;
  errorMessage = '';
  currentUser: any = null;
  addingToCart = false;
  cartItemCount = 0;
  quantity = 1;
  
  // Expose Math functions to template
  Math = Math;

  constructor(
    private authService: AuthService,
    private productsService: ProductsService,
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCartCount();
    this.loadProduct();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  /**
   * Loads the cart count
   */
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

  /**
   * Loads the product
   */
  loadProduct(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.errorMessage = 'Product ID not found';
      this.isLoading = false;
      return;
    }

    /**
     * Loads the product from the database
     */
    this.productsService.getAllProducts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.product = response.data.find(p => p.id === productId) || null;
          if (!this.product) {
            this.errorMessage = 'Product not found';
          }
        } else {
          this.errorMessage = response.message || 'Failed to load product';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.errorMessage = 'Failed to load product. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Adds the product to the cart
   */
  addToCart(): void {
    if (!this.product) return;

    if (this.product.stockQuantity === 0) {
      this.toastService.error('Product is out of stock!');
      return;
    }
    if (this.quantity < 1 || this.quantity > this.product.stockQuantity) {
      this.toastService.error('Invalid quantity selected!');
      return;
    }

    this.addingToCart = true;
    this.cartService.addToCart({
      productId: this.product.id,
      quantity: this.quantity
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(`${this.product?.name} added to cart!`);
          this.loadCartCount();
          this.quantity = 1; // reset after add
        } else {
          this.toastService.error(response.message || 'Failed to add to cart');
        }
        this.addingToCart = false;
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.toastService.error('Failed to add to cart. Please try again.');
        this.addingToCart = false;
      }
    });
  }

  /**
   * Updates the quantity of the product in the cart
   * @param change - The change in quantity
   */
  updateQuantity(change: number): void {
    if (!this.product) return;
    
    const newQuantity = this.quantity + change;
    if (newQuantity >= 1 && newQuantity <= this.product.stockQuantity) {
      this.quantity = newQuantity;
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * placeholder image
   */
  getProductImage(product: Product): string {
    if (!product.imageUrl || product.imageUrl.trim() === '') {
      return 'https://placehold.co/400x300/CCCCCC/666666?text=No+Image';
    }
    return product.imageUrl;
  }

  /**
   * Gets the stock status of the product
   * @param product - The product
   * @returns the stock status of the product
   */
  getStockStatus(product: Product): string {
    if (product.stockQuantity === 0) return 'Out of Stock';
    if (product.stockQuantity < 10) return `${product.stockQuantity} left`;
    return `${product.stockQuantity} in stock`;
  }

  /**
   * Checks if the product is low stock
   * @param product - The product
   * @returns true if the product is low stock, false otherwise
   */
  isLowStock(product: Product): boolean {
    return product.stockQuantity < 10;
  }
} 