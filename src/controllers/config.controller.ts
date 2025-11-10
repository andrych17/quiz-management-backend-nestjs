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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ConfigService } from '../services/config.service';
import { CreateConfigItemDto, UpdateConfigItemDto, ConfigItemResponseDto } from '../dto/config.dto';
import { ApiResponse as StdApiResponse, ResponseFactory } from '../interfaces/api-response.interface';

@ApiTags('config')
@Controller('api/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new configuration item' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Config item created successfully',
    type: ConfigItemResponseDto,
  })
  async create(@Body() createConfigItemDto: CreateConfigItemDto): Promise<StdApiResponse<ConfigItemResponseDto>> {
    const result = await this.configService.create(createConfigItemDto);
    return ResponseFactory.success(result, 'Config item created successfully', undefined, HttpStatus.CREATED);
  }

  @Get()
  @ApiOperation({ summary: 'Get all configuration items with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'group', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (group, key, value, order, createdAt, updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
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
  ) {
    return this.configService.findAll(page, limit, group, sortBy, sortOrder);
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
    return ResponseFactory.success(result, 'Location config items retrieved successfully');
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
    return ResponseFactory.success(result, 'Service config items retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get configuration item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config item retrieved successfully',
    type: ConfigItemResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<StdApiResponse<ConfigItemResponseDto>> {
    const result = await this.configService.findOne(id);
    return ResponseFactory.success(result, 'Config item retrieved successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update configuration item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config item updated successfully',
    type: ConfigItemResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConfigItemDto: UpdateConfigItemDto,
  ): Promise<StdApiResponse<ConfigItemResponseDto>> {
    const result = await this.configService.update(id, updateConfigItemDto);
    return ResponseFactory.success(result, 'Config item updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete configuration item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config item deleted successfully',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<StdApiResponse<any>> {
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
  async findByGroup(@Param('group') group: string): Promise<StdApiResponse<any>> {
    const result = await this.configService.findByGroup(group);
    return ResponseFactory.success(result, `Config items for group "${group}" retrieved successfully`);
  }
}