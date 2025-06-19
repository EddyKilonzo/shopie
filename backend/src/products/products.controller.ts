import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import {
  CreateProductsDto,
  ImageUploadResponseDto,
} from './dto/create-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from 'generated/prisma';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { Product } from 'generated/prisma';
import {
  CloudinaryService,
  ProductUploadType,
} from '../common/cloudinary/cloudinary.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true }))
    createProductsDto: CreateProductsDto,
  ): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productsService.create(createProductsDto);
      return {
        success: true,
        message: 'Product created successfully',
        data: product,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error creating product');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all products (Public)' })
  @ApiResponse({ status: 200, description: 'Return all products.' })
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiResponse<Product[]>> {
    try {
      const products = await this.productsService.findAll();
      return {
        success: true,
        message: 'Products retrieved successfully',
        data: products,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error retrieving products');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id (Public)' })
  @ApiResponse({ status: 200, description: 'Return product by id.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productsService.findOne(id);
      return {
        success: true,
        message: 'Product retrieved successfully',
        data: product,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error retrieving product');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true }))
    updateProductsDto: CreateProductsDto,
  ): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productsService.update(id, updateProductsDto);
      return {
        success: true,
        message: 'Product updated successfully',
        data: product,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error updating product');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productsService.delete(id);
      return {
        success: true,
        message: 'Product deleted successfully',
        data: product,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error deleting product');
    }
  }

  @Get('search/:query')
  @ApiOperation({ summary: 'Search products (Public)' })
  @ApiResponse({ status: 200, description: 'Return products by query.' })
  @HttpCode(HttpStatus.OK)
  async search(@Param('query') query: string): Promise<ApiResponse<Product[]>> {
    try {
      const products = await this.productsService.findByName(query);
      if (!products || !Array.isArray(products)) {
        throw new BadRequestException('Invalid search results');
      }
      return {
        success: true,
        message: 'Products retrieved successfully',
        data: products,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error retrieving products');
    }
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload product image (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            publicId: { type: 'string' },
            secureUrl: { type: 'string' },
            url: { type: 'string' },
            originalFilename: { type: 'string' },
            bytes: { type: 'number' },
            format: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @HttpCode(HttpStatus.CREATED)
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<ImageUploadResponseDto>> {
    try {
      const result = await this.cloudinaryService.uploadFile(
        file,
        ProductUploadType.PRODUCT_IMAGE,
      );
      return {
        success: true,
        message: 'Image uploaded successfully',
        data: {
          publicId: result.public_id,
          secureUrl: result.secure_url,
          url: result.url,
          originalFilename: result.original_filename,
          bytes: result.bytes,
          format: result.format,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error uploading image');
    }
  }

  @Post('upload-gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload product gallery images (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully.',
    type: [ImageUploadResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @HttpCode(HttpStatus.CREATED)
  async uploadGallery(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ApiResponse<ImageUploadResponseDto[]>> {
    try {
      const results = await this.cloudinaryService.uploadMultipleFiles(
        files,
        ProductUploadType.PRODUCT_GALLERY,
      );
      return {
        success: true,
        message: 'Gallery images uploaded successfully',
        data: results.map((result) => ({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          url: result.url,
          originalFilename: result.original_filename,
          bytes: result.bytes,
          format: result.format,
        })),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error uploading gallery images');
    }
  }

  @Delete('image/:publicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete product image (Admin only)' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @HttpCode(HttpStatus.OK)
  async deleteImage(@Param('publicId') publicId: string) {
    try {
      const result = await this.cloudinaryService.deleteFile(publicId);
      return {
        success: true,
        message: 'Image deleted successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error deleting image');
    }
  }
}
