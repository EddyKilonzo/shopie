import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProductsDto {
  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @IsOptional()
  stockQuantity?: number;
}
