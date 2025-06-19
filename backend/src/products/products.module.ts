import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [ProductsService, CloudinaryService],
  controllers: [ProductsController],
  imports: [PrismaModule, ConfigModule],
  exports: [ProductsService],
})
export class ProductsModule {}
