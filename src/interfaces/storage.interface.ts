/**
 * Storage Service Interface
 *
 * Abstraction layer for file storage backends.
 * Implementations: R2, S3, Azure Blob, Local File System, etc.
 */

export interface IStorageService {
  /**
   * Upload file to storage
   * @param fileBuffer - File content as buffer
   * @param fileName - Original filename
   * @param mimeType - MIME type of the file
   * @param prefix - Optional prefix/folder path
   * @returns Promise resolving to upload result with objectKey
   */
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    prefix?: string,
  ): Promise<{
    objectKey: string;
    backendUrl: string;
    fileSize: number;
  }>;

  /**
   * Retrieve file from storage
   * @param objectKey - Unique identifier for the file
   * @returns Promise resolving to file data
   */
  getFile(objectKey: string): Promise<{
    body: any;
    contentType: string;
    contentLength: number;
  }>;

  /**
   * Delete file from storage
   * @param objectKey - Unique identifier for the file
   * @returns Promise resolving when file is deleted
   */
  deleteFile(objectKey: string): Promise<void>;

  /**
   * Get backend API URL for file
   * @param objectKey - Unique identifier for the file
   * @returns Backend URL for file access
   */
  getBackendUrl(objectKey: string): string;

  /**
   * Extract object key from URL
   * @param url - Full URL or path
   * @returns Object key or null
   */
  extractObjectKey(url: string): string | null;
}

export const STORAGE_SERVICE_TOKEN = 'STORAGE_SERVICE';
