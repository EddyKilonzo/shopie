import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap, BehaviorSubject } from 'rxjs';
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

interface AuthResponse {
    token?: string;
    user?: User;
    message: string;
    success?: boolean;
    data?: User;
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

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
        this.toastService.setCurrentUser(null);
        this.cartService.clearCartItems();
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    setCurrentUser(user: User): void {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
        this.toastService.setCurrentUser(user.id);
        this.cartService.refreshCart();
    }
}