import { User } from '../../users/interfaces/user.interface';

export interface AuthResponse {
  message: string;
  user?: User;
  token?: string;
} 