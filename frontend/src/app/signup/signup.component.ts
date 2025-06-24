import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit{

  signupData = { email: '', password: '', name: ''};
  isLoading = false;
  errorMessage = '';
  successMessage='';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Check if is logged in
   */
  ngOnInit(): void {
    // Clear any existing auth data when accessing signup page
    this.authService.logout();
  }

  showMessage(text: string, Type: 'success' | 'error' ): void {
    if(Type === 'success') {
      this.successMessage = text;
      this.errorMessage = '';

    } else {
      this.errorMessage = text;
      this.successMessage = '';
    }
  }

  onSubmit(): void {
    if (this.signupData.email && this.signupData.password && this.signupData.name) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      console.log('Starting signup process...', this.signupData);

      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (this.isLoading) {
          console.log('Signup request timed out');
          this.isLoading = false;
          this.showMessage('Request timed out. Please try again.', 'error');
        }
      }, 10000); // 10 second timeout

      this.authService.signup(this.signupData).subscribe({
        next: (response) => {
          clearTimeout(timeoutId);
          console.log('Signup response received:', response);
          this.isLoading = false;
          // Check if signup was actually successful
          if (response.message === 'User registered successfully' && response.token && response.user) {
            this.showMessage('Creating account...', 'success');
            setTimeout(() => {
              this.router.navigate(['/products']);
            }, 1000);
          } else {
            // Signup failed but returned 200 status
            this.showMessage(response.message || 'Signup failed. Please try again.', 'error');
          }
        },
        error: (error: any) => {
          clearTimeout(timeoutId);
          console.error('Signup error:', error);
          this.isLoading = false;
          this.showMessage(error.error?.message || 'Signup failed. Please try again.', 'error');
        }
      });
    } else {
      this.showMessage('Please fill in all fields', 'error');
    }
  }

}
