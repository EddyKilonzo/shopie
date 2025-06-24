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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordWithTokenDto } from './dto/reset-password-with-token.dto';
import { MailerService } from '../mailer/mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  signup() {
    throw new Error('Method not implemented.');
  }
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private prisma: PrismaService,
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

  /**
   * Sends a password reset email to the user.
   * @param forgotPasswordDto - The data transfer object containing the user's email.
   * @returns A message indicating the result of the operation.
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(
        `Processing forgot password request for email: ${forgotPasswordDto.email}`,
      );

      const user = await this.usersService.findByEmail(forgotPasswordDto.email);
      if (!user) {
        console.log(`User not found for email: ${forgotPasswordDto.email}`);
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        };
      }

      console.log(`User found: ${user.email}, ID: ${user.id}`);

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      console.log('Generated reset token:', resetToken); // For debugging
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });
      console.log('Reset token saved to database');

      // Send password reset email
      try {
        console.log('Attempting to send password reset email...');
        await this.mailerService.sendPasswordResetEmail(user.email, resetToken);
        console.log(`Password reset email sent successfully to ${user.email}`);
        return {
          success: true,
          message: 'Password reset email sent successfully',
        };
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        console.error('Error details:', {
          message: (error as Error)?.message,
          stack: (error as Error)?.stack,
        });
        return {
          success: false,
          message: 'Failed to send password reset email',
        };
      }
    } catch (error) {
      console.error('Error in forgot password:', error);
      return {
        success: false,
        message: 'Error processing forgot password request',
      };
    }
  }

  /**
   * Resets the password using a reset token.
   * @param resetPasswordWithTokenDto - The data transfer object containing the reset token and new password.
   * @returns A message indicating the result of the operation.
   */
  async resetPasswordWithToken(
    resetPasswordWithTokenDto: ResetPasswordWithTokenDto,
  ): Promise<{ message: string }> {
    try {
      // Find user with valid reset token
      const user = await this.prisma.user.findFirst({
        where: {
          resetToken: resetPasswordWithTokenDto.resetToken,
          resetTokenExpiry: {
            gt: new Date(), // Token not expired
          },
        },
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(
        resetPasswordWithTokenDto.newPassword,
        10,
      );

      // Update password and clear reset token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedNewPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error resetting password with token:', error);
      throw new BadRequestException('Error resetting password');
    }
  }
}
