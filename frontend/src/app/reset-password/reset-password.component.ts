import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetToken: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get the reset token from URL query parameters
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'] || '';
      if (!this.resetToken) {
        this.errorMessage = 'Invalid reset link. Please request a new password reset.';
        this.toastService.show(this.errorMessage, 'error');
      }
    });
  }

  async onSubmit() {
    if (!this.resetToken) {
      this.errorMessage = 'Invalid reset link. Please request a new password reset.';
      return;
    }

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await this.authService.resetPasswordWithToken({
        resetToken: this.resetToken,
        newPassword: this.newPassword
      });
      
      this.successMessage = response.message || 'Password reset successfully!';
      this.toastService.show('Password reset successfully!', 'success');
      
      // Redirect to login after successful reset
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      this.errorMessage = error.error?.message || 'An error occurred while resetting your password';
      this.toastService.show(this.errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  requestNewReset() {
    this.router.navigate(['/forgot-password']);
  }
} 