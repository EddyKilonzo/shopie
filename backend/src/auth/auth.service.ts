import { JwtService } from '@nestjs/jwt';
import { UsersService } from './../users/users.service';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create.user.dto';
import { User } from '../users/interfaces/user.interface';
import { AuthResponse } from './interfaces/auth-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (user && (await bcrypt.compare(password, user.password))) {
        return { message: 'User validated successfully' };
      }
      return { message: 'Invalid credentials' };
    } catch {
      return { message: 'Error validating user' };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        return { message: 'User not found' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { message: 'Invalid password' };
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      const token = this.jwtService.sign(payload);

      return {
        message: 'Login successful',
        user,
        token,
      };
    } catch (error) {
      console.error('Error during login:', error);
      return { message: 'Error during login' };
    }
  }

  async register(user: CreateUserDto): Promise<AuthResponse> {
    try {
      const existingUser = await this.usersService.findByEmail(user.email);
      if (existingUser) {
        return { message: 'User already exists' };
      }

      const result = await this.usersService.create(user);
      return {
        message: 'User registered successfully',
        user: result.user,
        token: result.token,
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return { message: 'Error registering user' };
    }
  }

  async resetPassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        return { message: 'User not found' };
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        return { message: 'Invalid current password' };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.update(user.id, { password: hashedPassword });

      return { message: 'Password reset successfully' };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { message: 'Error resetting password' };
    }
  }
}
