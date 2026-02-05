import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { ConfigService } from '../services/config.service';
import {
  CreateConfigItemDto,
  UpdateConfigItemDto,
  ConfigItemResponseDto,
} from '../dto/config.dto';
import {
  ApiResponse as StdApiResponse,
  ResponseFactory,
} from '../interfaces/api-response.interface';

@ApiTags('config')
@Controller('api/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new configuration item' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Config item created successfully',
    type: ConfigItemResponseDto,
  })
  async create(
    @Body() createConfigItemDto: CreateConfigItemDto,
    @Req() req: any,
  ): Promise<StdApiResponse<any>> {
    const userInfo = {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role,
    };
    const result = await this.configService.create(
      createConfigItemDto,
      userInfo,
    );

    return {
      success: result.success,
      message: result.message,
      data: result.success ? result.data : null,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Get('ui-mappings')
  @ApiOperation({
    summary: 'Get key-value mappings for locations and services for UI',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config mappings retrieved successfully',
  })
  async getMappings(): Promise<StdApiResponse<any>> {
    const result = await this.configService.getMappings();
    return ResponseFactory.success(
      result,
      'Config mappings retrieved successfully',
    );
  }

  @Get('filter-options')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get filter options (locations and services) based on user permissions - for admin panel dropdowns',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Filter options retrieved successfully',
  })
  async getFilterOptions(@Req() req): Promise<StdApiResponse<any>> {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const filterOptions = await this.configService.getFilterOptionsForUser(
      userId,
      userRole,
    );
    return ResponseFactory.success(
      filterOptions,
      'Filter options retrieved successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all configuration items with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'group', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Sort by field (group, key, value, order, createdAt, updatedAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config items retrieved successfully',
    type: [ConfigItemResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('group') group?: string,
    @Query('sortBy') sortBy: string = 'group',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<StdApiResponse<any>> {
    const result = await this.configService.findAll(
      page,
      limit,
      group,
      sortBy,
      sortOrder,
    );
    return ResponseFactory.success(
      result,
      'Config items retrieved successfully',
    );
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all location configuration items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location config items retrieved successfully',
    type: [ConfigItemResponseDto],
  })
  async getLocations(): Promise<StdApiResponse<any>> {
    const result = await this.configService.getLocations();
    return ResponseFactory.success(
      result,
      'Location config items retrieved successfully',
    );
  }

  @Get('services')
  @ApiOperation({ summary: 'Get all service configuration items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service config items retrieved successfully',
    type: [ConfigItemResponseDto],
  })
  async getServices(): Promise<StdApiResponse<any>> {
    const result = await this.configService.getServices();
    return ResponseFactory.success(
      result,
      'Service config items retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get configuration item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config item retrieved successfully',
    type: ConfigItemResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<ConfigItemResponseDto>> {
    const result = await this.configService.findOne(id);
    return ResponseFactory.success(
      result,
      'Config item retrieved successfully',
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update configuration item' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config item updated successfully',
    type: ConfigItemResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConfigItemDto: UpdateConfigItemDto,
    @Req() req: any,
  ): Promise<StdApiResponse<any>> {
    const userInfo = {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role,
    };
    const result = await this.configService.update(
      id,
      updateConfigItemDto,
      userInfo,
    );

    return {
      success: result.success,
      message: result.message,
      data: result.success ? result.data : null,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete configuration item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config item deleted successfully',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<any>> {
    await this.configService.remove(id);
    return ResponseFactory.success(null, 'Config item deleted successfully');
  }

  @Get('group/:group')
  @ApiOperation({ summary: 'Get configuration items by group' })
  @ApiParam({ name: 'group', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config items retrieved successfully',
    type: [ConfigItemResponseDto],
  })
  async findByGroup(
    @Param('group') group: string,
  ): Promise<StdApiResponse<any>> {
    // Support both singular and plural forms for backward compatibility
    const groupMapping: Record<string, string> = {
      location: 'locations',
      service: 'services',
    };

    const normalizedGroup = groupMapping[group] || group;
    const result = await this.configService.findByGroup(normalizedGroup);
    return ResponseFactory.success(
      result,
      `Config items for group "${group}" retrieved successfully`,
    );
  }
}
