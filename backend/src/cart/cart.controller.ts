import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerGuard } from '../auth/guards/customer.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Cart } from 'generated/prisma';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard, CustomerGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin users cannot access cart.',
  })
  @HttpCode(HttpStatus.CREATED)
  async addToCart(
    @Request() req: { user: { userId: string; email: string; role: string } },
    @Body(new ValidationPipe({ transform: true })) addToCartDto: AddToCartDto,
  ): Promise<ApiResponse<Cart>> {
    try {
      const cartItem = await this.cartService.addToCart(
        req.user.userId,
        addToCartDto,
      );
      return {
        success: true,
        message: 'Item added to cart successfully',
        data: cartItem,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error adding to cart');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin users cannot access cart.',
  })
  @HttpCode(HttpStatus.OK)
  async getUserCart(
    @Request() req: { user: { userId: string; email: string; role: string } },
  ): Promise<ApiResponse<Cart[]>> {
    try {
      const cartItems = await this.cartService.getUserCart(req.user.userId);
      return {
        success: true,
        message: 'Cart retrieved successfully',
        data: cartItems,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error retrieving cart');
    }
  }

  @Get('total')
  @ApiOperation({ summary: 'Get cart total' })
  @ApiResponse({
    status: 200,
    description: 'Cart total calculated successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin users cannot access cart.',
  })
  @HttpCode(HttpStatus.OK)
  async getCartTotal(
    @Request() req: { user: { userId: string; email: string; role: string } },
  ): Promise<ApiResponse<{ total: number; itemCount: number }>> {
    try {
      const cartTotal = await this.cartService.getCartTotal(req.user.userId);
      return {
        success: true,
        message: 'Cart total calculated successfully',
        data: cartTotal,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error calculating cart total');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin users cannot access cart.',
  })
  @HttpCode(HttpStatus.OK)
  async removeFromCart(
    @Request() req: { user: { userId: string; email: string; role: string } },
    @Param('id') cartItemId: string,
  ): Promise<ApiResponse<void>> {
    try {
      await this.cartService.removeFromCart(req.user.userId, cartItemId);
      return {
        success: true,
        message: 'Item removed from cart successfully',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error removing from cart');
    }
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin users cannot access cart.',
  })
  @HttpCode(HttpStatus.OK)
  async clearCart(
    @Request() req: { user: { userId: string; email: string; role: string } },
  ): Promise<ApiResponse<void>> {
    try {
      await this.cartService.clearCart(req.user.userId);
      return {
        success: true,
        message: 'Cart cleared successfully',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error clearing cart');
    }
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Process checkout and send order confirmation' })
  @ApiResponse({
    status: 200,
    description: 'Checkout processed successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin users cannot access cart.',
  })
  @HttpCode(HttpStatus.OK)
  async checkout(
    @Request() req: { user: { userId: string; email: string; role: string } },
  ): Promise<ApiResponse<{ message: string; orderId: string }>> {
    try {
      const result = await this.cartService.checkout(req.user.userId);
      return {
        success: true,
        message: result.message,
        data: { message: result.message, orderId: result.orderId },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error processing checkout');
    }
  }
}
