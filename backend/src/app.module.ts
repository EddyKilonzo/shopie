import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, ProductsModule, CartModule, MailerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
