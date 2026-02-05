import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserQuizAssignmentService } from '../services/user-quiz-assignment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import {
  ApiResponse as StdApiResponse,
  ResponseFactory,
} from '../interfaces/api-response.interface';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';

export class CreateUserQuizAssignmentDto {
  userId: number;
  quizId: number;
  isActive?: boolean;
}

export class UserQuizAssignmentResponseDto {
  id: number;
  userId: number;
  quizId: number;
  isActive: boolean;
  assignedBy: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  user?: any;
  quiz?: any;
}

@ApiTags('user-quiz-assignments')
@Controller('api/user-quiz-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
@ApiBearerAuth()
export class UserQuizAssignmentController {
  constructor(
    private readonly userQuizAssignmentService: UserQuizAssignmentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Assign admin user to quiz' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User-quiz assignment created successfully',
    type: UserQuizAssignmentResponseDto,
  })
  async create(
    @Body() createDto: CreateUserQuizAssignmentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<StdApiResponse<UserQuizAssignmentResponseDto>> {
    const result = await this.userQuizAssignmentService.create(
      createDto,
      user.email,
    );
    return ResponseFactory.success(
      result,
      'User-quiz assignment created successfully',
      undefined,
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all user-quiz assignments with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'quizId', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User-quiz assignments retrieved successfully',
    type: [UserQuizAssignmentResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('userId') userId?: number,
    @Query('quizId') quizId?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.userQuizAssignmentService.findAll(
      page,
      limit,
      userId,
      quizId,
      isActive,
    );
  }

  @Get('user/:userId/quizzes')
  @ApiOperation({ summary: 'Get all quizzes assigned to a specific user' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User assigned quizzes retrieved successfully',
    type: [UserQuizAssignmentResponseDto],
  })
  async findUserQuizzes(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.userQuizAssignmentService.findUserQuizzes(
      userId,
      page,
      limit,
      isActive,
    );
  }

  @Get('quiz/:quizId/users')
  @ApiOperation({ summary: 'Get all users assigned to a specific quiz' })
  @ApiParam({ name: 'quizId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz assigned users retrieved successfully',
    type: [UserQuizAssignmentResponseDto],
  })
  async findQuizUsers(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.userQuizAssignmentService.findQuizUsers(
      quizId,
      page,
      limit,
      isActive,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove user-quiz assignment' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User-quiz assignment removed successfully',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<void>> {
    await this.userQuizAssignmentService.remove(id);
    return ResponseFactory.success(
      undefined,
      'User-quiz assignment removed successfully',
    );
  }
}
