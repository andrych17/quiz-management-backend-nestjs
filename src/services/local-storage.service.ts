import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService } from '../interfaces/storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Local File System Storage Implementation
 *
 * Use for:
 * - Development/testing
 * - Self-hosted deployments
 * - Small-scale applications
 */
@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Default to ./uploads directory
    this.basePath =
      this.configService.get<string>('LOCAL_STORAGE_PATH') ||
      path.join(process.cwd(), 'uploads');

    this.baseUrl =
      this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';

    // Ensure base directory exists
    this.ensureBaseDirectory();
  }

  private async ensureBaseDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      this.logger.log(`Local storage initialized at: ${this.basePath}`);
    } catch (error) {
      this.logger.error(`Failed to create storage directory: ${error.message}`);
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    prefix: string = '',
  ): Promise<{
    objectKey: string;
    backendUrl: string;
    fileSize: number;
  }> {
    try {
      // Generate object key
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const sanitizedPrefix = prefix.replace(/[^a-z0-9\/]/gi, '_');
      const sanitizedFileName = fileName.replace(/[^a-z0-9.]/gi, '_');

      const objectKey = sanitizedPrefix
        ? `${sanitizedPrefix}/${timestamp}_${random}_${sanitizedFileName}`
        : `${timestamp}_${random}_${sanitizedFileName}`;

      const filePath = path.join(this.basePath, objectKey);
      const directory = path.dirname(filePath);

      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });

      // Write file
      await fs.writeFile(filePath, fileBuffer);

      this.logger.log(`File uploaded successfully: ${objectKey}`);

      return {
        objectKey,
        backendUrl: this.getBackendUrl(objectKey),
        fileSize: fileBuffer.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to local storage: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getFile(objectKey: string): Promise<{
    body: any;
    contentType: string;
    contentLength: number;
  }> {
    try {
      const filePath = path.join(this.basePath, objectKey);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw new NotFoundException(`File not found: ${objectKey}`);
      }

      // Read file
      const fileBuffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);

      // Determine content type from extension
      const ext = path.extname(objectKey).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
      };

      return {
        body: fileBuffer,
        contentType: mimeTypes[ext] || 'application/octet-stream',
        contentLength: stats.size,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get file from local storage: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteFile(objectKey: string): Promise<void> {
    try {
      const filePath = path.join(this.basePath, objectKey);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        this.logger.warn(`File not found for deletion: ${objectKey}`);
        return; // File doesn't exist, nothing to delete
      }

      // Delete file
      await fs.unlink(filePath);

      this.logger.log(`File deleted successfully: ${objectKey}`);

      // Optionally clean up empty directories
      await this.cleanupEmptyDirectories(path.dirname(filePath));
    } catch (error) {
      this.logger.error(
        `Failed to delete file from local storage: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async cleanupEmptyDirectories(dirPath: string): Promise<void> {
    try {
      // Don't delete the base directory
      if (dirPath === this.basePath || !dirPath.startsWith(this.basePath)) {
        return;
      }

      const files = await fs.readdir(dirPath);

      // If directory is empty, delete it
      if (files.length === 0) {
        await fs.rmdir(dirPath);
        this.logger.debug(`Cleaned up empty directory: ${dirPath}`);

        // Recursively check parent directory
        await this.cleanupEmptyDirectories(path.dirname(dirPath));
      }
    } catch (error) {
      // Ignore errors in cleanup
      this.logger.debug(
        `Could not cleanup directory ${dirPath}: ${error.message}`,
      );
    }
  }

  generateObjectKey(fileName: string, prefix: string = ''): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    // Sanitize prefix (allow forward slashes for nested paths)
    const sanitizedPrefix = prefix.replace(/[^a-z0-9\/]/gi, '_');

    // Sanitize filename (preserve extension)
    const sanitizedFileName = fileName.replace(/[^a-z0-9.]/gi, '_');

    if (sanitizedPrefix) {
      return `${sanitizedPrefix}/${timestamp}_${random}_${sanitizedFileName}`;
    }

    return `${timestamp}_${random}_${sanitizedFileName}`;
  }

  getBackendUrl(objectKey: string): string {
    return `${this.baseUrl}/api/files/${objectKey}`;
  }

  extractObjectKey(url: string): string | null {
    try {
      // Extract from /api/files/{objectKey} pattern
      const match = url.match(/\/api\/files\/(.+)$/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }

      // Fallback: might be just the object key itself
      if (!url.includes('http')) {
        return url;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to extract object key from URL: ${url}`);
      return null;
    }
  }
}
