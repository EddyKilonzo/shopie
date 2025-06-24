import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}
  /**
   * This method is used to submit the forgot password form
   * @returns The response from the server
   */
  async onSubmit() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await this.authService.forgotPassword(this.email);
      
      if (response.success) {
        this.successMessage = response.message;
        this.toastService.show('Password reset email sent successfully!', 'success');
        // Optionally redirect to login after a delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      } else {
        this.errorMessage = response.message || 'Failed to send password reset email';
        this.toastService.show(this.errorMessage, 'error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      this.errorMessage = 'An error occurred while processing your request';
      this.toastService.show(this.errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }
} 