import { JwtService } from '@nestjs/jwt';
import { UsersService } from './../users/users.service';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create.user.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  signup() {
    throw new Error('Method not implemented.');
  }
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validates a user by email and password.
   * @param email - The email of the user.
   * @param password - The password of the user.
   * @returns A message indicating the result of the validation.
   */
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

  /**
   * Logs in a user.
   * @param email - The email of the user.
   * @param password - The password of the user.
   * @returns The authentication response.
   */
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

  /**
   *registers a new user.
   * @param user - The user data to register.
   * @returns registed user
   */

  async register(user: CreateUserDto): Promise<AuthResponse> {
    try {
      // Check if user already exists
      try {
        const existingUser = await this.usersService.findByEmail(user.email);
        if (existingUser) {
          return { message: 'User already exists' };
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
        return { message: 'Error checking existing user' };
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

  /**
   * Resets the password for a user.
   * @param userId - The ID of the user whose password is to be reset.
   * @param resetPasswordDto - The data transfer object containing the new password.
   */

  async resetPassword(
    userId: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    try {
      // Get the user
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        resetPasswordDto.currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(
        resetPasswordDto.newPassword,
        10,
      );

      // Update the password
      await this.usersService.update(user.id, {
        password: hashedNewPassword,
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error(`Error resetting password for user ${userId}:`, error);
      throw new Error('Error resetting password');
    }
  }
}
