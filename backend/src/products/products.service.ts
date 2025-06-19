import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductsDto } from './dto/create-products.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Product } from 'generated/prisma';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new product.
   * @param createProductsDto - The data to create the product.
   * @returns The created product.
   */

  async create(createProductsDto: CreateProductsDto): Promise<Product> {
    try {
      const productData = {
        ...createProductsDto,
        imageUrl: createProductsDto.imageUrl || '', // default is empty string if imageUrl is undefined
      };

      const product = await this.prisma.product.create({
        data: productData,
      });
      return product;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(`Failed to create product`);
    }
  }

  /**
   *
   * @returns An array of all products.
   */
  async findAll(): Promise<Product[]> {
    try {
      const products = await this.prisma.product.findMany();
      return products;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to fetch products');
    }
  }

  /**
   *
   * @param id - The ID of the product to find.
   * @returns  The product with the specified ID.
   */
  async findOne(id: string): Promise<Product> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new BadRequestException(`Product with id ${id} not found`);
      }
      return product;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(`Failed to fetch product with id ${id}`);
    }
  }

  /**
   *
   * @param id - The ID of the product to update.
   * @param updateProductsDto - The data to update the product.
   * @returns The updated product.
   */

  async update(
    id: string,
    updateProductsDto: CreateProductsDto,
  ): Promise<Product> {
    try {
      const productData = {
        ...updateProductsDto,
        imageUrl: updateProductsDto.imageUrl || '', // Provide default empty string if imageUrl is undefined
      };

      const product = await this.prisma.product.update({
        where: { id },
        data: productData,
      });
      return product;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(`Failed to update product with id ${id}`);
    }
  }

  /**
   * Deletes a product by its ID.
   * @param id - The ID of the product to delete.
   * @returns The deleted product.
   */
  async delete(id: string): Promise<Product> {
    try {
      const product = await this.prisma.product.delete({
        where: { id },
      });
      return product;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(`Failed to delete product with id ${id}`);
    }
  }

  /**
   *
   * @param name - The name of the product to search for.
   * Searches for products by name.
   * @returns An array of products matching the search criteria.
   */

  async findByName(name: string): Promise<Product[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          name: {
            contains: name,
            mode: 'insensitive',
          },
        },
      });
      return products;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        `Failed to fetch products with name ${name}`,
      );
    }
  }
}
