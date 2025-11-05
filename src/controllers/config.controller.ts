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
  async create(@Body() createConfigItemDto: CreateConfigItemDto): Promise<ConfigItemResponseDto> {
    return this.configService.create(createConfigItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all configuration items with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'group', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config items retrieved successfully',
    type: [ConfigItemResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('group') group?: string,
  ) {
    return this.configService.findAll(page, limit, group);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all location configuration items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location config items retrieved successfully',
    type: [ConfigItemResponseDto],
  })
  async getLocations() {
    return this.configService.getLocations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get configuration item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config item retrieved successfully',
    type: ConfigItemResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ConfigItemResponseDto> {
    return this.configService.findOne(id);
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
  ): Promise<ConfigItemResponseDto> {
    return this.configService.update(id, updateConfigItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete configuration item by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config item deleted successfully',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.configService.remove(id);
  }

  @Get('group/:group')
  @ApiOperation({ summary: 'Get configuration items by group' })
  @ApiParam({ name: 'group', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Config items retrieved successfully',
    type: [ConfigItemResponseDto],
  })
  async findByGroup(@Param('group') group: string) {
    return this.configService.findByGroup(group);
  }
}