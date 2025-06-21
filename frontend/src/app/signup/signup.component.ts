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

      this.authService.signup(this.signupData).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Check if signup was actually successful
          if (response.message === 'User registered successfully' && response.token && response.user) {
            this.showMessage('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
              this.router.navigate(['/products']);
            }, 1000);
          } else {
            // Signup failed but returned 200 status
            this.showMessage(response.message || 'Signup failed. Please try again.', 'error');
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.showMessage(error.error?.message || 'Signup failed. Please try again.', 'error');
        }
      });
    } else {
      this.showMessage('Please fill in all fields', 'error');
    }
  }

}
