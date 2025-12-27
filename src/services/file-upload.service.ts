import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { R2StorageService } from './r2-storage.service';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly maxFileSize: number = 5 * 1024 * 1024; // 5MB in bytes
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  /**
   * Validate image file
   */
  validateImage(
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
  ): void {
    // Check file size
    if (fileBuffer.length > this.maxFileSize) {
      throw new BadRequestException(
        `Ukuran file terlalu besar. Maksimal ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Tipe file tidak didukung. Hanya menerima: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Check file extension
    const ext = path.extname(originalName).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!validExtensions.includes(ext)) {
      throw new BadRequestException(
        `Ekstensi file tidak valid. Hanya menerima: ${validExtensions.join(', ')}`,
      );
    }
  }

  /**
   * Save image file to R2 cloud storage
   */
  async saveImage(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    prefix: string = 'quiz',
  ): Promise<{
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    originalName: string;
  }> {
    // Validate image
    this.validateImage(fileBuffer, mimeType, originalName);

    try {
      // Upload to R2 storage
      const uploadResult = await this.r2StorageService.uploadFile(
        fileBuffer,
        originalName,
        mimeType,
        prefix,
      );

      return {
        fileName: uploadResult.objectKey, // R2 object key
        filePath: uploadResult.backendUrl, // Backend API URL (not direct R2 URL)
        fileSize: uploadResult.fileSize,
        mimeType,
        originalName,
      };
    } catch (error) {
      throw new BadRequestException(`Gagal menyimpan file ke cloud storage: ${error.message}`);
    }
  }

  /**
   * Delete image file from R2 cloud storage
   */
  async deleteImage(filePath: string): Promise<void> {
    try {
      // Extract object key from URL
      const objectKey = this.r2StorageService.extractObjectKey(filePath);
      
      if (objectKey) {
        await this.r2StorageService.deleteFile(objectKey);
      } else {
        console.warn(`Could not extract object key from URL: ${filePath}`);
      }
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Decode base64 image
   */
  decodeBase64Image(base64String: string): {
    buffer: Buffer;
    mimeType: string;
  } {
    // Check if it's a data URI
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    if (matches && matches.length === 3) {
      // Data URI format: data:image/png;base64,iVBORw0KG...
      return {
        buffer: Buffer.from(matches[2], 'base64'),
        mimeType: matches[1],
      };
    } else {
      // Plain base64 string (assume JPEG)
      return {
        buffer: Buffer.from(base64String, 'base64'),
        mimeType: 'image/jpeg',
      };
    }
  }

  /**
   * Upload image from base64 string to R2
   */
  async uploadFromBase64(
    base64String: string,
    originalName: string = 'image.jpg',
    prefix: string = 'quiz',
  ): Promise<{
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    originalName: string;
  }> {
    const { buffer, mimeType } = this.decodeBase64Image(base64String);
    return this.saveImage(buffer, originalName, mimeType, prefix);
  }

  /**
   * Get full URL for file access
   * Returns backend API URL that serves files from private R2 bucket
   */
  getFileUrl(filePath: string): string {
    // Backend URL is already a complete URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // Fallback: use R2 service to generate backend URL from object key
    return this.r2StorageService.getBackendUrl(filePath);
  }
}
