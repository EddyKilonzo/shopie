import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  loginData = { email: '', password: '' };
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Clear any existing auth data when accessing login page
   */
  ngOnInit(): void {
    this.authService.logout();
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.successMessage = text;
      this.errorMessage = '';
    } else {
      this.errorMessage = text;
      this.successMessage = '';
    }
  }

  onSubmit(): void {
    if (this.loginData.email && this.loginData.password) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.login(this.loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Check if login was actually successful
          if (response.message === 'Login successful' && response.token && response.user) {
            this.showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
              this.router.navigate(['/products']);
            }, 1000);
          } else {
            // Login failed but returned 200 status
            this.showMessage(response.message || 'Login failed. Please try again.', 'error');
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.showMessage(error.error?.message || 'Login failed. Please try again.', 'error');
        }
      });
    } else {
      this.showMessage('Please fill in all fields', 'error');
    }
  }
}
