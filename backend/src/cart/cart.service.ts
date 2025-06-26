import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Cart } from 'generated/prisma';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

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

  /**
   * Processes checkout and sends order confirmation email.
   * @param userId - The ID of the user.
   * @returns Order confirmation details.
   */
  async checkout(
    userId: string,
  ): Promise<{ message: string; orderId: string }> {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Get cart items
      const cartItems = await this.prisma.cart.findMany({
        where: { userId },
        include: {
          Product: true,
        },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Calculate total
      const total = cartItems.reduce(
        (sum, item) => sum + Number(item.total),
        0,
      );

      // Create purchase record
      const purchase = await this.prisma.purchase.create({
        data: {
          userId,
          totalAmount: total,
          status: 'CONFIRMED',
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.Product.price,
              productName: item.productName,
              total: item.total,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Create order details for email
      const orderDetails = {
        id: purchase.id,
        items: cartItems.map((item) => ({
          name: item.productName,
          price: Number(item.total),
          quantity: item.quantity,
        })),
        totalAmount: total,
      };

      // Send order confirmation email
      try {
        await this.mailerService.sendOrderConfirmationEmail(
          user.email,
          orderDetails,
          user.name,
        );
      } catch (error) {
        console.error('Failed to send order confirmation email:', error);
        // Don't throw error here as checkout was successful
      }

      // Clear the cart
      await this.clearCart(userId);

      return {
        message:
          'Order placed successfully! Check your email for confirmation.',
        orderId: purchase.id,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error processing checkout');
    }
  }

  /**
   * Increases the quantity of an item in the cart.
   * @param userId - The ID of the user.
   * @param cartItemId - The ID of the cart item.
   * @returns The updated cart item.
   */
  async increaseQuantity(userId: string, cartItemId: string): Promise<Cart> {
    try {
      const cartItem = await this.prisma.cart.findFirst({
        where: {
          id: cartItemId,
          userId,
        },
        include: {
          Product: true,
        },
      });

      if (!cartItem) {
        throw new BadRequestException(
          `Cart item with id ${cartItemId} not found`,
        );
      }

      // Check if there's enough stock
      if (cartItem.Product.stockQuantity < 1) {
        throw new BadRequestException(
          'No more stock available for this product',
        );
      }

      // Update cart item quantity and total
      const newQuantity = cartItem.quantity + 1;
      const newTotal = Number(cartItem.Product.price) * newQuantity;

      const updatedCartItem = await this.prisma.cart.update({
        where: { id: cartItemId },
        data: {
          quantity: newQuantity,
          total: newTotal,
        },
        include: {
          Product: true,
        },
      });

      // Decrease product stock
      await this.prisma.product.update({
        where: { id: cartItem.productId },
        data: {
          stockQuantity: {
            decrement: 1,
          },
        },
      });

      return updatedCartItem;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error increasing quantity');
    }
  }

  /**
   * Decreases the quantity of an item in the cart.
   * @param userId - The ID of the user.
   * @param cartItemId - The ID of the cart item.
   * @returns The updated cart item or null if removed.
   */
  async decreaseQuantity(
    userId: string,
    cartItemId: string,
  ): Promise<Cart | null> {
    try {
      const cartItem = await this.prisma.cart.findFirst({
        where: {
          id: cartItemId,
          userId,
        },
        include: {
          Product: true,
        },
      });

      if (!cartItem) {
        throw new BadRequestException(
          `Cart item with id ${cartItemId} not found`,
        );
      }

      if (cartItem.quantity <= 1) {
        // Remove item if quantity would become 0
        await this.removeFromCart(userId, cartItemId);
        return null;
      }

      // Update cart item quantity and total
      const newQuantity = cartItem.quantity - 1;
      const newTotal = Number(cartItem.Product.price) * newQuantity;

      const updatedCartItem = await this.prisma.cart.update({
        where: { id: cartItemId },
        data: {
          quantity: newQuantity,
          total: newTotal,
        },
        include: {
          Product: true,
        },
      });

      // Increase product stock
      await this.prisma.product.update({
        where: { id: cartItem.productId },
        data: {
          stockQuantity: {
            increment: 1,
          },
        },
      });

      return updatedCartItem;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error decreasing quantity');
    }
  }

  /**
   * Gets the purchase history for a user.
   * @param userId - The ID of the user.
   * @returns An array of purchase records.
   */
  async getPurchaseHistory(userId: string) {
    try {
      const purchases = await this.prisma.purchase.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return purchases;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error fetching purchase history');
    }
  }
}
