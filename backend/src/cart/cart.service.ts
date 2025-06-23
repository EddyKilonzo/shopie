import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Cart } from 'generated/prisma';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adds a product to the user's cart.
   * @param userId - The ID of the user.
   * @param addToCartDto - The data to add to the cart.
   * @returns The updated cart item.
   */

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    try {
      // Check if product exists and has enough stock
      const product = await this.prisma.product.findUnique({
        where: { id: addToCartDto.productId },
      });

      if (!product) {
        throw new BadRequestException(
          `Product with id ${addToCartDto.productId} not found`,
        );
      }

      if (product.stockQuantity < addToCartDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stockQuantity}`,
        );
      }

      // Calculate total for this item
      const itemTotal = Number(product.price) * addToCartDto.quantity;

      // Check if item already exists in cart
      const existingCartItem = await this.prisma.cart.findFirst({
        where: {
          userId,
          productId: addToCartDto.productId,
        },
      });

      if (existingCartItem) {
        // Update existing cart item
        const newQuantity = existingCartItem.quantity + addToCartDto.quantity;

        if (product.stockQuantity < newQuantity) {
          throw new BadRequestException(
            `Insufficient stock for total quantity. Available: ${product.stockQuantity}`,
          );
        }

        // Calculate new total
        const newTotal = Number(product.price) * newQuantity;

        const updatedCartItem = await this.prisma.cart.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: newQuantity,
            total: newTotal,
          },
        });

        // Update product stock
        await this.prisma.product.update({
          where: { id: addToCartDto.productId },
          data: {
            stockQuantity: product.stockQuantity - addToCartDto.quantity,
          },
        });

        return updatedCartItem;
      } else {
        // Create new cart item
        const newCartItem = await this.prisma.cart.create({
          data: {
            quantity: addToCartDto.quantity,
            productName: product.name,
            total: itemTotal,
            userId,
            productId: addToCartDto.productId,
          },
        });

        // Update product stock
        await this.prisma.product.update({
          where: { id: addToCartDto.productId },
          data: {
            stockQuantity: product.stockQuantity - addToCartDto.quantity,
          },
        });

        return newCartItem;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error adding product to cart');
    }
  }

  /**
   * Retrieves the user's cart items.
   * @param userId - The ID of the user.
   * @return An array of cart items.
   */
  async getUserCart(userId: string): Promise<Cart[]> {
    try {
      const cartItems = await this.prisma.cart.findMany({
        where: { userId },
        include: {
          Product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return cartItems;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error fetching cart');
    }
  }
  /**
   * @param userId - The ID of the user.
   * @returns total price and item count of the user's cart.
   */

  async getCartTotal(
    userId: string,
  ): Promise<{ total: number; itemCount: number }> {
    try {
      const cartItems = await this.prisma.cart.findMany({
        where: { userId },
        select: {
          total: true,
          quantity: true,
        },
      });

      const total = cartItems.reduce(
        (sum, item) => sum + Number(item.total),
        0,
      );
      const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      return { total, itemCount };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error calculating cart total');
    }
  }

  /**
   * Removes an item from the user's cart.
   * @param userId - The ID of the user.
   * @param cartItemId
   */

  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    try {
      const cartItem = await this.prisma.cart.findFirst({
        where: {
          id: cartItemId,
          userId,
        },
      });

      if (!cartItem) {
        throw new BadRequestException(
          `Cart item with id ${cartItemId} not found`,
        );
      }

      // Restore product stock
      await this.prisma.product.update({
        where: { id: cartItem.productId },
        data: {
          stockQuantity: {
            increment: cartItem.quantity,
          },
        },
      });

      // Remove cart item
      await this.prisma.cart.delete({
        where: { id: cartItemId },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        `Error removing cart item with id ${cartItemId}`,
      );
    }
  }

  /**
   * Clears all items from the user's cart.
   * @param userId - The ID of the user.
   */
  async clearCart(userId: string): Promise<void> {
    try {
      // Delete all cart items for the user
      await this.prisma.cart.deleteMany({
        where: { userId },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error clearing cart');
    }
  }
}
