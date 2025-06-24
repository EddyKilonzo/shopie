import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap, BehaviorSubject, firstValueFrom } from 'rxjs';
import { ToastService } from './toast';
import { CartService } from './cart';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

interface SignupRequest {
    email: string;
    password: string;
    name: string;
}

interface UpdateProfileRequest {
    name: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
}

interface ForgotPasswordRequest {
    email: string;
}

interface ResetPasswordWithTokenRequest {
    resetToken: string;
    newPassword: string;
}

interface AuthResponse {
    token?: string;
    user?: User;
    message: string;
    success?: boolean;
    data?: User;
}

interface ForgotPasswordResponse {
    success: boolean;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/auth';
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(
        private http: HttpClient,
        private toastService: ToastService,
        private cartService: CartService
    ) {
        this.loadStoredUser();
    }
    /**
     * This method is used to load the stored user from the local storage
     */

    private loadStoredUser(): void {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                const parsedUser = JSON.parse(user);
                this.currentUserSubject.next(parsedUser);
                this.toastService.setCurrentUser(parsedUser.id);
                this.cartService.refreshCart();
            } catch (error) {
                // If JSON parsing fails, clear the invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                this.currentUserSubject.next(null);
                this.toastService.setCurrentUser(null);
                this.cartService.clearCartItems();
            }
        } else {
            this.toastService.setCurrentUser(null);
            this.cartService.clearCartItems();
        }
    }
    /**
     * This method is used to login the user
     * @param loginRequest - The login request
     * @returns The auth response
     */

    login(loginRequest: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginRequest)
            .pipe(
                tap(response => {
                    
                    if (response.token && response.user && response.message === 'Login successful') {
                        localStorage.setItem('token', response.token);
                        localStorage.setItem('user', JSON.stringify(response.user));
                        this.currentUserSubject.next(response.user);
                        this.toastService.setCurrentUser(response.user.id);
                        this.cartService.refreshCart();
                    }
                })
            );
    }
    /**
     * This method is used to signup the user
     * @param signupRequest - The signup request
     * @returns The auth response
     */

    signup(signupRequest: SignupRequest): Observable<AuthResponse> {
        console.log('AuthService: Making signup request to', `${this.apiUrl}/register`);
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, signupRequest)
            .pipe(
                tap(response => {
                    console.log('AuthService: Signup response received', response);
                    // Only store auth data if signup was successful
                    if (response.token && response.user && response.message === 'User registered successfully') {
                        localStorage.setItem('token', response.token);
                        localStorage.setItem('user', JSON.stringify(response.user));
                        this.currentUserSubject.next(response.user);
                        this.toastService.setCurrentUser(response.user.id);
                        this.cartService.refreshCart();
                    }
                })
            );
    }
    /**
     * This method is used to send the forgot password email to the user
     * @param email - The email of the user
     * @returns The forgot password response
     */

    async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
        return firstValueFrom(this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, { email }));
    }
    /**
     * This method is used to reset the password of the user
     * @param resetData - The reset data
     * @returns The auth response
     */

    async resetPasswordWithToken(resetData: ResetPasswordWithTokenRequest): Promise<AuthResponse> {
        return firstValueFrom(this.http.post<AuthResponse>(`${this.apiUrl}/reset-password-with-token`, resetData));
    }
    /**
     * This method is used to update the profile of the user
     * @param updateData - The update data
     * @returns The auth response
     */

    updateProfile(updateData: UpdateProfileRequest): Observable<AuthResponse> {
        return this.http.put<AuthResponse>(`http://localhost:3000/users/profile`, updateData)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        localStorage.setItem('user', JSON.stringify(response.data));
                        this.currentUserSubject.next(response.data);
                        this.toastService.setCurrentUser(response.data.id);
                    }
                })
            );
    }
    /**
     * This method is used to delete the account of the user
     * @returns The auth response
     */

    deleteAccount(): Observable<AuthResponse> {
        return this.http.delete<AuthResponse>(`http://localhost:3000/users/profile`)
            .pipe(
                tap(response => {
                    if (response.success) {
                        this.logout();
                    }
                })
            );
    }
    /**
     * This method is used to logout the user
     */

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
        this.toastService.setCurrentUser(null);
        this.cartService.clearCartItems();
    }
    /**
     * This method is used to get the token of the user
     * @returns The token of the user
     */

    getToken(): string | null {
        return localStorage.getItem('token');
    }
    /**
     * This method is used to check if the user is logged in
     * @returns true if the user is logged in, false otherwise
     */

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    /**
     * This method is used to get the current user
     * @returns The current user
     */

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }
    /**
     * This method is used to set the current user
     * @param user - The user to set
     */

    setCurrentUser(user: User): void {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
        this.toastService.setCurrentUser(user.id);
        this.cartService.refreshCart();
    }
}