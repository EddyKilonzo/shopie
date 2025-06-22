import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  currentUser: any = null;
  cartItemCount = 0;
  isEditing = false;
  isLoading = false;
  isSaving = false;
  
  // Form data
  editForm = {
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCartCount();
  }

  /**
   * Loads the current user
   */
  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.editForm.name = this.currentUser.name;
      this.editForm.email = this.currentUser.email;
    }
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

  startEditing(): void {
    this.isEditing = true;
    this.editForm.currentPassword = '';
    this.editForm.newPassword = '';
    this.editForm.confirmPassword = '';
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.loadCurrentUser();
  }

  saveProfile(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;
    
    const updateData: any = {
      name: this.editForm.name,
      email: this.editForm.email
    };

    // Only include password fields if user wants to change password
    if (this.editForm.newPassword) {
      updateData.currentPassword = this.editForm.currentPassword;
      updateData.newPassword = this.editForm.newPassword;
    }

    // Debug: Check if token exists
    const token = this.authService.getToken();
    console.log('Token exists:', !!token);
    console.log('Token:', token ? token.substring(0, 20) + '...' : 'No token');

    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Profile updated successfully!');
          if (response.data) {
            this.currentUser = response.data;
            this.authService.setCurrentUser(response.data);
          }
          this.isEditing = false;
          this.loadCurrentUser(); // Refresh form data
        } else {
          this.toastService.error(response.message || 'Failed to update profile');
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.toastService.error('Failed to update profile. Please try again.');
        this.isSaving = false;
      }
    });
  }

  validateForm(): boolean {
    // Validate name
    if (!this.editForm.name.trim()) {
      this.toastService.error('Name is required');
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editForm.email)) {
      this.toastService.error('Please enter a valid email address');
      return false;
    }

    // Validate password change if attempting to change password
    if (this.editForm.newPassword) {
      if (!this.editForm.currentPassword) {
        this.toastService.error('Current password is required to change password');
        return false;
      }

      if (this.editForm.newPassword.length < 6) {
        this.toastService.error('New password must be at least 6 characters long');
        return false;
      }

      if (this.editForm.newPassword !== this.editForm.confirmPassword) {
        this.toastService.error('New passwords do not match');
        return false;
      }
    }

    return true;
  }

  /**
   * Deletes the account
   * @returns true if the account is deleted, false otherwise
   */
  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.isLoading = true;
      
      this.authService.deleteAccount().subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Account deleted successfully');
            this.authService.logout();
            this.router.navigate(['/login']);
          } else {
            this.toastService.error(response.message || 'Failed to delete account');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting account:', error);
          this.toastService.error('Failed to delete account. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Gets the display name of the role
   * @param role - The role
   * @returns the display name of the role
   */
  getRoleDisplayName(role: string): string {
    return role === 'ADMIN' ? 'Admin' : 'Customer';
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
