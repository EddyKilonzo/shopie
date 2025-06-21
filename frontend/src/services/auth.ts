import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap, BehaviorSubject } from 'rxjs';

interface User {
    id: string;
    email: string;
    name: string;
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

interface AuthResponse {
    token?: string;
    user?: User;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/auth';
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadStoredUser();
    }

    private loadStoredUser(): void {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                this.currentUserSubject.next(JSON.parse(user));
            } catch (error) {
                // If JSON parsing fails, clear the invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                this.currentUserSubject.next(null);
            }
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
                    }
                })
            );
    }

    signup(signupRequest: SignupRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, signupRequest)
            .pipe(
                tap(response => {
                    // Only store auth data if signup was successful
                    if (response.token && response.user && response.message === 'User registered successfully') {
                        localStorage.setItem('token', response.token);
                        localStorage.setItem('user', JSON.stringify(response.user));
                        this.currentUserSubject.next(response.user);
                    }
                })
            );
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
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
}