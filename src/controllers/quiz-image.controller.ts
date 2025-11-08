import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { QuizImageService } from '../services/quiz-image.service';
import { CreateQuizImageDto, UpdateQuizImageDto, QuizImageResponseDto, UploadQuizImageDto } from '../dto/quiz-image.dto';
import { diskStorage } from 'multer';
import * as path from 'path';

@ApiTags('Quiz Images')
@Controller('api/quiz-images')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuizImageController {
  constructor(private readonly quizImageService: QuizImageService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Create quiz image record',
    description: 'Create a new quiz image record (file should already be uploaded). Requires admin role.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Image record created successfully',
    type: QuizImageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or quiz already has image' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async create(@Body() createQuizImageDto: CreateQuizImageDto) {
    return await this.quizImageService.create(createQuizImageDto);
  }

  @Post('upload')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const service = req['quizImageService'] as QuizImageService;
        const uploadPath = service?.getUploadPath() || './uploads/quiz-images';
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const service = req['quizImageService'] as QuizImageService;
        const quizId = parseInt(req.body.quizId);
        const fileName = service?.generateFileName(file.originalname, quizId) || file.originalname;
        cb(null, fileName);
      },
    }),
  }))
  @ApiOperation({ 
    summary: 'Upload quiz image',
    description: 'Upload and create a quiz image in one step. Requires admin role.' 
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'Image uploaded and created successfully',
    type: QuizImageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or quiz already has image' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async uploadImage(
    @UploadedFile() file: any,
    @Body() uploadDto: UploadQuizImageDto
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file
    this.quizImageService.validateImageFile(file);

    // Create image record
    const createDto: CreateQuizImageDto = {
      quizId: uploadDto.quizId,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      altText: uploadDto.altText,
      createdBy: uploadDto.createdBy,
    };

    return await this.quizImageService.create(createDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get all quiz images',
    description: 'Retrieve all quiz images. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all quiz images',
    type: [QuizImageResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll() {
    return await this.quizImageService.findAll();
  }

  @Get('quiz/:quizId')
  @ApiOperation({ 
    summary: 'Get image for specific quiz',
    description: 'Retrieve the image for a specific quiz.' 
  })
  @ApiParam({ name: 'quizId', type: 'number', description: 'Quiz ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Quiz image details',
    type: QuizImageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz or image not found' })
  async findByQuizId(@Param('quizId', ParseIntPipe) quizId: number) {
    const image = await this.quizImageService.findByQuizId(quizId);
    if (!image) {
      throw new BadRequestException(`No image found for quiz ${quizId}`);
    }
    return image;
  }

  @Get('quiz/:quizId/url')
  @ApiOperation({ 
    summary: 'Get image URL for specific quiz',
    description: 'Get the image URL/path for a specific quiz.' 
  })
  @ApiParam({ name: 'quizId', type: 'number', description: 'Quiz ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image URL',
    schema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', example: '/uploads/quiz-images/quiz_1_123456.jpg' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz image not found' })
  async getImageUrlByQuiz(@Param('quizId', ParseIntPipe) quizId: number) {
    const imageUrl = await this.quizImageService.getImageByQuizUrl(quizId);
    if (!imageUrl) {
      throw new BadRequestException(`No active image found for quiz ${quizId}`);
    }
    return { imageUrl };
  }

  @Get('statistics')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get image statistics',
    description: 'Get statistical information about all quiz images. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Image statistics',
    schema: {
      type: 'object',
      properties: {
        totalImages: { type: 'number', example: 50 },
        totalSize: { type: 'number', example: 52428800 },
        averageSize: { type: 'number', example: 1048576 },
        imagesByType: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'image/jpeg' },
              count: { type: 'number', example: 30 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getImageStatistics() {
    return await this.quizImageService.getImageStats();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get quiz image by ID',
    description: 'Retrieve a specific quiz image by its ID.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image details',
    type: QuizImageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.quizImageService.findOne(id);
  }

  @Get(':id/url')
  @ApiOperation({ 
    summary: 'Get image URL by ID',
    description: 'Get the image URL/path by image ID.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image URL',
    schema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', example: '/uploads/quiz-images/quiz_1_123456.jpg' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async getImageUrl(@Param('id', ParseIntPipe) id: number) {
    const imageUrl = await this.quizImageService.getImageUrl(id);
    return { imageUrl };
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Update quiz image',
    description: 'Update quiz image details (not the file itself). Requires admin role.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image updated successfully',
    type: QuizImageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuizImageDto: UpdateQuizImageDto,
  ) {
    return await this.quizImageService.update(id, updateQuizImageDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete quiz image',
    description: 'Delete a quiz image and its file. Requires admin role.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Image ID' })
  @ApiResponse({ status: 204, description: 'Image deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.quizImageService.remove(id);
  }

  @Post('quiz/:quizId/replace')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/quiz-images',
      filename: (req, file, cb) => {
        const quizId = parseInt(req.params.quizId);
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = path.extname(file.originalname);
        cb(null, `quiz_${quizId}_${timestamp}_${random}${extension}`);
      },
    }),
  }))
  @ApiOperation({ 
    summary: 'Replace quiz image',
    description: 'Replace existing quiz image with a new one. Requires admin role.' 
  })
  @ApiParam({ name: 'quizId', type: 'number', description: 'Quiz ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'Image replaced successfully',
    type: QuizImageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async replaceImage(
    @Param('quizId', ParseIntPipe) quizId: number,
    @UploadedFile() file: any,
    @Body() body: { altText?: string; createdBy?: string }
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file
    this.quizImageService.validateImageFile(file);

    const createDto: Omit<CreateQuizImageDto, 'quizId'> = {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      altText: body.altText,
      createdBy: body.createdBy,
    };

    return await this.quizImageService.replaceQuizImage(quizId, createDto);
  }
}