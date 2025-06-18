import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductsDto } from './dto/create-products.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Product } from 'generated/prisma';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductsDto: CreateProductsDto): Promise<Product> {
    try {
      const product = await this.prisma.product.create({
        data: createProductsDto,
      });
      return product;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(`Failed to create product`);
    }
  }

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

  async update(
    id: string,
    updateProductsDto: CreateProductsDto,
  ): Promise<Product> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: updateProductsDto,
      });
      return product;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(`Failed to update product with id ${id}`);
    }
  }

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
}
