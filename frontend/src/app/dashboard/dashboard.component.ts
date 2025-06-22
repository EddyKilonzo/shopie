import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ProductsService, Product, ImageUploadResponse } from '../../services/products';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
/**
 * 
 */
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  products: Product[] = [];
  isLoading = false;
  errorMessage = '';
  
  get totalProducts(): number {
    return this.products.length;
  }
  
  get lowStockItems(): number {
    return this.products.filter(p => p.stockQuantity < 10).length;
  }
  
  get outOfStockItems(): number {
    return this.products.filter(p => p.stockQuantity === 0).length;
  }
  
  // Add Product Form
  showAddForm = false;
  formData = {
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    imageUrl: ''
  };
  
  // Edit Product
  editingProduct: Product | null = null;
  
  // File upload
  selectedFile: File | null = null;
  isUploading = false;
  uploadedImageUrl = '';

  constructor(
    private authService: AuthService,
    private productsService: ProductsService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('Current user:', this.currentUser);
    console.log('User role:', this.currentUser.role);
    
    // Check if user is admin
    if (this.currentUser.role !== 'ADMIN') {
      this.toastService.show('Access denied. Admin privileges required.', 'error');
      this.router.navigate(['/products']);
      return;
    }
    
    this.loadProducts();
  }

  /**
   * Loads the products from the database
   */
  loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading products...');
    
    this.productsService.getProducts().subscribe({
      next: (products) => {
        console.log('Products loaded successfully:', products);
        this.products = products;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Failed to load products: ' + (error.message || error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Shows the add product form
   */
  showAddProductForm() {
    this.showAddForm = true;
    this.editingProduct = null;
    this.resetForm();
  }

  /**
   * Shows the edit product form
   * @param product - The product to edit
   */
  showEditProductForm(product: Product): void {
    this.editingProduct = product;
    this.showAddForm = true;
    this.formData = {
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl || ''
    };
    this.uploadedImageUrl = product.imageUrl || '';
  }

  resetForm() {
    this.formData = {
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      imageUrl: ''
    };
    this.selectedFile = null;
    this.uploadedImageUrl = '';
  }

  cancelForm() {
    this.showAddForm = false;
    this.editingProduct = null;
    this.resetForm();
  }

  /**
   * Handles the file selection event
   * @param event - The file selection event
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.toastService.show('Please select a valid image file (JPEG, PNG, or WebP)', 'error');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.toastService.show('File size must be less than 5MB', 'error');
        return;
      }
      
      this.selectedFile = file;
      this.uploadImage();
    }
  }

  /**
   * Uploads the image to the database via cloudinary
   */
  uploadImage() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.productsService.uploadImage(this.selectedFile).subscribe({
      next: (response: ImageUploadResponse) => {
        this.uploadedImageUrl = response.secureUrl;
        this.formData.imageUrl = response.secureUrl;
        this.isUploading = false;
        this.toastService.show('Image uploaded successfully!', 'success');
      },
      error: (error) => {
        this.isUploading = false;
        this.toastService.show('Failed to upload image: ' + (error.message || error), 'error');
        console.error('Error uploading image:', error);
      }
    });
  }

  /**
   * Removes the image from the form
   */
  removeImage() {
    this.selectedFile = null;
    this.uploadedImageUrl = '';
    this.formData.imageUrl = '';
  }

  /**
   * Adds a new product to the database
   */
  addProduct() {
    if (!this.validateForm(this.formData)) return;

    this.productsService.createProduct(this.formData).subscribe({
      next: (product) => {
        this.products.push(product);
        this.showAddForm = false;
        this.resetForm();
        this.toastService.show('Product added successfully!', 'success');
      },
      error: (error) => {
        this.toastService.show('Failed to add product', 'error');
        console.error('Error adding product:', error);
      }
    });
  }

  /**
   * Updates an existing product in the database
   */
  updateProduct() {
    if (!this.editingProduct || !this.validateForm(this.formData)) return;

    const updatedProduct = {
      ...this.formData,
      id: this.editingProduct.id
    };

    this.productsService.updateProduct(this.editingProduct.id, updatedProduct).subscribe({
      next: (product) => {
        const index = this.products.findIndex(p => p.id === this.editingProduct!.id);
        if (index !== -1) {
          this.products[index] = product;
        }
        this.showAddForm = false;
        this.editingProduct = null;
        this.resetForm();
        this.toastService.show('Product updated successfully!', 'success');
      },
      error: (error) => {
        this.toastService.show('Failed to update product', 'error');
        console.error('Error updating product:', error);
      }
    });
  }

  /**
   * Deletes a product from the database
   * @param productId - The ID of the product to delete
   */
  deleteProduct(productId: string) {
    // Check if user is admin
    if (this.currentUser?.role !== 'ADMIN') {
      this.toastService.show('Access denied. Admin privileges required to delete products.', 'error');
      return;
    }
    
    console.log('Attempting to delete product with ID:', productId);
    this.productsService.deleteProduct(productId).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== productId);
        this.toastService.show('Product deleted successfully!', 'success');
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        
        let errorMessage = 'Failed to delete product';
        if (error.status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.toastService.show(errorMessage, 'error');
      }
    });
  }

  /**
   * Validates the form data
   * @param form - The form data
   * @returns true if the form is valid, false otherwise
   */
  validateForm(form: any): boolean {
    if (!form.name.trim()) {
      this.toastService.show('Product name is required', 'error');
      return false;
    }
    if (!form.description.trim()) {
      this.toastService.show('Product description is required', 'error');
      return false;
    }
    if (form.price <= 0) {
      this.toastService.show('Price must be greater than 0', 'error');
      return false;
    }
    if (form.stockQuantity < 0) {
      this.toastService.show('Stock quantity cannot be negative', 'error');
      return false;
    }
    return true;
  }

  /**
   * Logs out the user
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Navigates to the products page
   */
  navigateToProducts() {
    this.router.navigate(['/products']);
  }
}
