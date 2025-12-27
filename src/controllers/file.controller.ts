import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { R2StorageService } from '../services/r2-storage.service';

@ApiTags('files')
@Controller('api/files')
export class FileController {
  constructor(private readonly r2StorageService: R2StorageService) {}

  /**
   * Serve file from private R2 bucket
   * This endpoint acts as a proxy, keeping the R2 bucket private
   */
  @Get('*objectKey')
  @ApiOperation({ 
    summary: 'Get file from cloud storage',
    description: 'Retrieves and serves files from private R2 bucket. Supports caching headers.'
  })
  @ApiParam({ 
    name: 'objectKey', 
    description: 'R2 object key (e.g., quiz-images/123456_abc.jpg)',
    example: 'quiz-images/1234567890_abc123_image.jpg'
  })
  async getFile(
    @Param('objectKey') objectKey: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    try {
      // Decode the object key (it might be URL encoded)
      const decodedKey = decodeURIComponent(objectKey);
      
      // Retrieve file from R2
      const file = await this.r2StorageService.getFile(decodedKey);

      // Set proper response headers
      res.set({
        'Content-Type': file.contentType,
        'Content-Length': file.contentLength,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': `"${decodedKey}"`,
      });

      // Return file as streamable
      return new StreamableFile(file.body);
    } catch (error) {
      throw new NotFoundException(`File not found: ${objectKey}`);
    }
  }
}
