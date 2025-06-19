import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from 'generated/prisma';
import { JwtService } from '@nestjs/jwt';

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserResponse {
  user: User;
  token: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private mapPrismaUserToInterface(user: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: any;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role as Role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Hashes a password.
   * @param password - The password to hash.
   * @returns The hashed password.
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 10;
      const hash = await (
        bcrypt.hash as (a: string, b: number) => Promise<string>
      )(password, saltRounds);
      if (typeof hash !== 'string') {
        throw new Error('Failed to hash password');
      }
      return hash;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to hash password: ${error.message}`);
      }
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Creates a new user.
   * @param data - The data to create the user.
   * @returns The created user.
   */

  async create(data: CreateUserDto): Promise<CreateUserResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException(
        `User with email ${data.email} already exists`,
      );
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role:
          data.role === 'ADMIN' || data.role === 'CUSTOMER'
            ? (data.role as Role)
            : Role.CUSTOMER,
      },
    });

    if (!user) {
      throw new Error('Failed to create user');
    }

    const mappedUser = this.mapPrismaUserToInterface(user);
    const payload = {
      userId: mappedUser.id,
      email: mappedUser.email,
      role: mappedUser.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      user: mappedUser,
      token,
    };
  }

  /**
   * Fetches all users.
   * @returns An array of all users.
   */
  async findAll(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      return users.map((user) => this.mapPrismaUserToInterface(user));
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching users:', error.message);
        throw error;
      }
      throw new Error('Unknown error fetching users');
    }
  }

  /**
   * Fetches users by role.
   * @param role - The role to filter users by.
   * @returns An array of users with the specified role.
   */

  async findByRole(role: Role): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          role: role,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return users.map((user) => this.mapPrismaUserToInterface(user));
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error fetching users by role ${role}:`, error.message);
        throw error;
      }
      throw new Error('Unknown error fetching users by role');
    }
  }

  /**
   * Fetches a user by ID.
   * @param id - The ID of the user to find.
   * @returns The user with the specified ID.
   */

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }
      return this.mapPrismaUserToInterface(user);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error fetching user with id ${id}:`, error.message);
        throw error;
      }
      throw new Error('Unknown error fetching user');
    }
  }

  /**
   * Fetches a user by email.
   * @param email - The email of the user to find.
   * @returns  The user with the specified email.
   */

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw new Error(`User with email ${email} not found`);
      }
      return this.mapPrismaUserToInterface(user);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          `Error fetching user with email ${email}:`,
          error.message,
        );
        throw error;
      }
      throw new Error('Unknown error fetching user by email');
    }
  }

  /**
   * Updates a user.
   * @param id - The ID of the user to update.
   * @param data - The data to update the user.
   * @returns The updated user.
   */

  async update(id: string, data: UpdateUserDto): Promise<User> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!existingUser) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      if (typeof data.email === 'string' && data.email !== existingUser.email) {
        const userWithEmail = await this.prisma.user.findUnique({
          where: { email: data.email },
        });
        if (userWithEmail) {
          throw new ConflictException(
            `User with email ${data.email} already exists`,
          );
        }
      }

      const updateData: Partial<User> = {};
      if (typeof data.name === 'string') updateData.name = data.name;
      if (typeof data.email === 'string') updateData.email = data.email;

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      return this.mapPrismaUserToInterface(updatedUser);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error updating user with id ${id}:`, error.message);
        throw error;
      }
      throw new Error('Unknown error updating user');
    }
  }

  /**
   * Deletes a user by ID.
   * @param id - The ID of the user to delete.
   * @returns the message confirming deletion.
   */

  async delete(id: string): Promise<{ message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }
      await this.prisma.user.delete({
        where: { id },
      });
      return { message: `User with id ${id} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting user with id ${id}:`, error);
      throw error;
    }
  }
}
