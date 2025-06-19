import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Express } from 'express';

/**
 * Result interface for Cloudinary uploads
 * Contains all essential information returned after successful upload
 */
export interface CloudinaryUploadResult {
  public_id: string; // Unique identifier for the uploaded file
  secure_url: string; // HTTPS URL to access the file
  url: string; // HTTP URL to access the file
  original_filename: string; // Original name of the uploaded file
  bytes: number; // File size in bytes
  format: string; // File format (jpg, png, pdf, etc.)
  resource_type: string; // Type of resource (image, video, raw)
  created_at: string; // Upload timestamp
  width?: number; // Image width (for images only)
  height?: number; // Image height (for images only)
  folder: string; // Cloudinary folder path
}

/**
 * Configuration for different uploads
 */
export interface ProductUploadConfig {
  uploadType: ProductUploadType;
  maxSizeBytes: number; // Maximum file size in bytes
  allowedFormats: string[]; // Array of allowed file formats (e.g., ['jpg', 'png'])
  folder: string; // Cloudinary folder path for uploads
  transformation?: Record<string, unknown>; // Optional transformation string for image processing
}

/**
 * Enum for defining all upload types
 */
export enum ProductUploadType {
  PRODUCT_IMAGE = 'product_image',
  PRODUCT_GALLERY = 'product_gallery',
  CATEGORY_IMAGE = 'category_image',
  USER_AVATAR = 'user_avatar',
  BANNER_IMAGE = 'banner_image',
  THUMBNAIL = 'thumbnail',
  DOCUMENT = 'document',
}

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary with environment variables
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Get upload configuration based on upload type
   */
  private getUploadConfig(uploadType: ProductUploadType): ProductUploadConfig {
    const configs: Record<ProductUploadType, ProductUploadConfig> = {
      [ProductUploadType.PRODUCT_IMAGE]: {
        uploadType,
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/products/images',
        transformation: {
          width: 800,
          height: 800,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ProductUploadType.PRODUCT_GALLERY]: {
        uploadType,
        maxSizeBytes: 8 * 1024 * 1024, // 8MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/products/gallery',
        transformation: {
          width: 1200,
          height: 1200,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ProductUploadType.CATEGORY_IMAGE]: {
        uploadType,
        maxSizeBytes: 3 * 1024 * 1024, // 3MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/categories',
        transformation: {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ProductUploadType.USER_AVATAR]: {
        uploadType,
        maxSizeBytes: 2 * 1024 * 1024, // 2MB
        allowedFormats: ['jpg', 'jpeg', 'png'],
        folder: 'shopie/users/avatars',
        transformation: {
          width: 200,
          height: 200,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
          gravity: 'face',
        },
      },
      [ProductUploadType.BANNER_IMAGE]: {
        uploadType,
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/banners',
        transformation: {
          width: 1920,
          height: 600,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ProductUploadType.THUMBNAIL]: {
        uploadType,
        maxSizeBytes: 1 * 1024 * 1024, // 1MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'shopie/thumbnails',
        transformation: {
          width: 300,
          height: 300,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [ProductUploadType.DOCUMENT]: {
        uploadType,
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        allowedFormats: ['pdf', 'doc', 'docx', 'txt'],
        folder: 'shopie/documents',
      },
    };

    return configs[uploadType];
  }

  /**
   * Validate file before upload
   */
  private validateFile(
    file: Express.Multer.File,
    config: ProductUploadConfig,
  ): void {
    // Check if file exists
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check if file has required properties
    if (!file.originalname || !file.size || !file.mimetype) {
      throw new BadRequestException('Invalid file structure');
    }

    // Check file size
    if (file.size && file.size > config.maxSizeBytes) {
      throw new BadRequestException(
        `File size ${file.size} bytes exceeds maximum allowed size of ${config.maxSizeBytes} bytes`,
      );
    }

    // Check file format
    const fileExtension = file.originalname?.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.allowedFormats.includes(fileExtension)) {
      throw new BadRequestException(
        `File format ${fileExtension || 'unknown'} is not allowed. Allowed formats: ${config.allowedFormats.join(', ')}`,
      );
    }

    // Check MIME type
    const isValidMimeType = config.allowedFormats.some(
      (format) =>
        file.mimetype.includes(format) ||
        (format === 'jpg' && file.mimetype.includes('jpeg')),
    );

    if (!isValidMimeType) {
      throw new BadRequestException(
        `Invalid MIME type ${file.mimetype}. Expected formats: ${config.allowedFormats.join(', ')}`,
      );
    }
  }

  /**
   * Upload single file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    uploadType: ProductUploadType,
    customOptions?: Record<string, unknown>,
  ): Promise<CloudinaryUploadResult> {
    const config = this.getUploadConfig(uploadType);

    // Validate file
    this.validateFile(file, config);

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        folder: config.folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...(config.transformation && { transformation: config.transformation }),
        ...(customOptions || {}),
      };

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        })
        .end(file.buffer);
    });
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadType: ProductUploadType,
    customOptions?: Record<string, unknown>,
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, uploadType, customOptions),
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<{ result: string }> {
    try {
      const result = (await cloudinary.uploader.destroy(publicId)) as {
        result: string;
      };
      return result;
    } catch (error: any) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  } /**
   * Delete multiple files from Cloudinary
   */
  async deleteMultipleFiles(
    publicIds: string[],
  ): Promise<{ deleted: Record<string, string> }> {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to delete files: ${error.message}`);
    }
  }

  /**
   * Get file details from Cloudinary
   */
  async getFileDetails(publicId: string): Promise<any> {
    try {
      const result = (await cloudinary.api.resource(publicId)) as any;
      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to get file details: ${error.message}`,
      );
    }
  }

  /**
   * Generate transformation URL for existing image
   */
  generateTransformationUrl(publicId: string, transformations: any): string {
    return cloudinary.url(publicId, transformations);
  }

  /**
   * Get optimized URL for web display
   */
  getOptimizedUrl(publicId: string, width?: number, height?: number): string {
    return cloudinary.url(publicId, {
      width: width || 800,
      height: height || 600,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto',
    });
  }

  /**
   * Create archive of multiple files
   */
  async createArchive(publicIds: string[]): Promise<string> {
    try {
      const result = await cloudinary.uploader.create_archive({
        resource_type: 'image',
        type: 'upload',
        target_format: 'zip',
        public_ids: publicIds,
        use_original_filename: true,
      }) as { secure_url: string };
      return result.secure_url;
    } catch (error) {
      throw new BadRequestException(
        `Failed to create archive: ${error.message}`,
      );
    }
  }
  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(cloudinaryUrl: string): string {
    const parts = cloudinaryUrl.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }
}
