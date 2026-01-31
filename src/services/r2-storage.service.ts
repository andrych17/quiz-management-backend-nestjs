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
  private readonly isEnabled: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME') || 'gms-quiz-app';

    // Use backend URL instead of public R2 URL (bucket stays private)
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
      `R2 Storage Service initialized with private bucket: ${this.bucketName}`,
    );
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
   * Upload file to R2 storage (private bucket)
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    prefix: string = 'quiz-images',
  ): Promise<{
    objectKey: string;
    backendUrl: string;
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

      // Generate backend API URL instead of direct R2 URL
      const backendUrl = this.getBackendUrl(objectKey);

      this.logger.log(`File uploaded to private R2 bucket: ${objectKey}`);

      return {
        objectKey,
        backendUrl,
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
   * Get backend API URL for file (instead of direct R2 URL)
   * This keeps the bucket private and serves files through backend
   */
  getBackendUrl(objectKey: string): string {
    return `${this.backendUrl}/api/files/${encodeURIComponent(objectKey)}`;
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
