import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockQuantity: number;
}

export class ImageUploadResponseDto {
  @ApiProperty()
  publicId: string;

  @ApiProperty()
  secureUrl: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  originalFilename: string;

  @ApiProperty()
  bytes: number;

  @ApiProperty()
  format: string;
}
