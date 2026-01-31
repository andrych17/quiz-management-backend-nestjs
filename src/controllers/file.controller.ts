import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
  Inject,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  IStorageService,
  STORAGE_SERVICE_TOKEN,
} from '../interfaces/storage.interface';

@ApiTags('files')
@Controller('api/files')
export class FileController {
  constructor(
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * Serve file from storage backend
   * This endpoint acts as a proxy for private storage backends
   */
  @Get('*path')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  @ApiOperation({
    summary: 'Get file from storage',
    description:
      'Retrieves and serves files from configured storage backend. Supports caching headers.',
  })
  @ApiParam({
    name: 'path',
    description:
      'Storage object key with full path (e.g., question/123/image.jpg)',
    example: 'question/516/1234567890_abc123_image.jpg',
  })
  async getFile(
    @Param() params: any,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    // Get the wildcard path - NestJS stores it as an array in params[0]
    const objectKey = Array.isArray(params.path)
      ? params.path.join('/')
      : params.path;

    // Decode the object key (it might be URL encoded)
    const decodedKey = decodeURIComponent(objectKey);

    try {
      // Retrieve file from storage backend
      const file = await this.storageService.getFile(decodedKey);

      // Set proper response headers WITHOUT charset for binary files
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Length', file.contentLength);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('ETag', `"${decodedKey}"`);

      // Send raw binary data
      res.send(file.body);
    } catch (error) {
      throw new NotFoundException(`File not found: ${decodedKey}`);
    }
  }
}
