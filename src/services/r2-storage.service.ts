import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { IStorageService } from '../interfaces/storage.interface';

@Injectable()
export class R2StorageService implements IStorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly backendUrl: string;
  private readonly publicUrl: string | null;
  private readonly isEnabled: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME') || 'gms-quiz-app';

    // Public URL for direct CDN access (fastest, recommended)
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || null;

    // Backend URL as fallback for private buckets
    this.backendUrl =
      this.configService.get<string>('BACKEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      'http://localhost:3001';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'R2 credentials are not configured. R2 Storage Service is DISABLED. File uploads will fail.',
      );
      this.isEnabled = false;
      return;
    }

    // Initialize S3 client with R2 endpoint
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.isEnabled = true;
    this.logger.log(
      `R2 Storage Service initialized with bucket: ${this.bucketName}`,
    );
    if (this.publicUrl) {
      this.logger.log(
        `R2 Public URL configured: ${this.publicUrl} (Direct CDN access enabled)`,
      );
    } else {
      this.logger.log(
        'R2 Public URL not set. Using backend proxy for file serving.',
      );
    }
  }

  /**
   * Generate unique object key for file storage
   */
  private generateObjectKey(fileName: string, prefix: string = 'quiz'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    // Allow forward slashes in prefix (for nested paths like question/5)
    const sanitizedPrefix = prefix.replace(/[^a-z0-9\/]/gi, '_');
    const sanitizedFileName = fileName.replace(/[^a-z0-9.]/gi, '_');

    return `${sanitizedPrefix}/${timestamp}_${random}_${sanitizedFileName}`;
  }

  /**
   * Upload file to R2 storage
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    prefix: string = 'quiz-images',
  ): Promise<{
    objectKey: string;
    backendUrl: string;
    publicUrl?: string;
    fileSize: number;
  }> {
    if (!this.isEnabled) {
      throw new Error('R2 Storage is disabled. Credentials not configured.');
    }

    try {
      const objectKey = this.generateObjectKey(fileName, prefix);

      const uploadParams: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: mimeType,
        ContentLength: fileBuffer.length,
        // Store metadata for reference
        Metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // Generate URLs: prefer public URL if available (fastest)
      const backendUrl = this.getBackendUrl(objectKey);
      const publicUrl = this.publicUrl
        ? this.getPublicUrl(objectKey)
        : undefined;

      this.logger.log(
        `File uploaded to R2: ${objectKey} (Public: ${!!publicUrl})`,
      );

      return {
        objectKey,
        backendUrl,
        publicUrl,
        fileSize: fileBuffer.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to R2: ${error.message}`,
        error.stack,
      );
      throw new Error(`R2 upload failed: ${error.message}`);
    }
  }

  /**
   * Get file from R2 storage
   */
  async getFile(objectKey: string): Promise<{
    body: Buffer;
    contentType: string;
    contentLength: number;
  }> {
    if (!this.isEnabled) {
      throw new Error('R2 Storage is disabled. Credentials not configured.');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const response = await this.s3Client.send(command);

      // Convert stream to buffer using AWS SDK built-in method
      const byteArray = await response.Body.transformToByteArray();
      const buffer = Buffer.from(byteArray);

      return {
        body: buffer,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength || buffer.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get file from R2: ${error.message}`,
        error.stack,
      );
      throw new Error(`R2 file retrieval failed: ${error.message}`);
    }
  }

  /**
   * Delete file from R2 storage
   */
  async deleteFile(objectKey: string): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn(
        `Skipping delete for ${objectKey} because R2 is disabled.`,
      );
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${objectKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from R2: ${error.message}`,
        error.stack,
      );
      // Don't throw error, just log it - deletion failures shouldn't break the application
    }
  }

  /**
   * Get public URL for direct CDN access (fastest)
   * Only works if R2_PUBLIC_URL is configured
   */
  getPublicUrl(objectKey: string): string | null {
    if (!this.publicUrl) {
      return null;
    }
    return `${this.publicUrl}/${objectKey}`;
  }

  /**
   * Get backend API URL for file (fallback for private buckets)
   * Serves files through backend proxy
   */
  getBackendUrl(objectKey: string): string {
    return `${this.backendUrl}/api/files/${encodeURIComponent(objectKey)}`;
  }

  /**
   * Get preferred URL (public if available, otherwise backend)
   */
  getPreferredUrl(objectKey: string): string {
    return this.getPublicUrl(objectKey) || this.getBackendUrl(objectKey);
  }

  /**
   * Extract object key from backend API URL
   */
  extractObjectKey(backendUrl: string): string | null {
    try {
      // Extract from /api/files/{objectKey} pattern
      const match = backendUrl.match(/\/api\/files\/(.+)$/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }

      // Fallback: might be just the object key itself
      if (!backendUrl.includes('http')) {
        return backendUrl;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to extract object key from URL: ${backendUrl}`);
      return null;
    }
  }
}
