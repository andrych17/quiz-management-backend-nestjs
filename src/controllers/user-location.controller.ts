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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserLocationService } from '../services/user-location.service';
import { CreateUserLocationDto, UpdateUserLocationDto, UserLocationResponseDto } from '../dto/user-location.dto';

@ApiTags('User Locations')
@Controller('api/user-locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserLocationController {
  constructor(private readonly userLocationService: UserLocationService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Assign location to user',
    description: 'Create a new location assignment for a user. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Location assigned successfully',
    type: UserLocationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or user already has location' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User or location not found' })
  async create(@Body() createUserLocationDto: CreateUserLocationDto) {
    return await this.userLocationService.create(createUserLocationDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get all user location assignments',
    description: 'Retrieve all user location assignments. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all user location assignments',
    type: [UserLocationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll() {
    return await this.userLocationService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ 
    summary: 'Get location for specific user',
    description: 'Retrieve the location assignment for a specific user.' 
  })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User location assignment',
    type: UserLocationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.userLocationService.findByUserId(userId);
  }

  @Get('location/:locationId')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get users for specific location',
    description: 'Retrieve all users assigned to a specific location. Requires admin role.' 
  })
  @ApiParam({ name: 'locationId', type: 'number', description: 'Location ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users assigned to the location',
    type: [UserLocationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async findByLocationId(@Param('locationId', ParseIntPipe) locationId: number) {
    return await this.userLocationService.findByLocationId(locationId);
  }

  @Get('location/:locationId/active')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get active users for specific location',
    description: 'Retrieve all active users assigned to a specific location. Requires admin role.' 
  })
  @ApiParam({ name: 'locationId', type: 'number', description: 'Location ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of active users assigned to the location',
    type: [UserLocationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveUsersByLocation(@Param('locationId', ParseIntPipe) locationId: number) {
    return await this.userLocationService.getActiveUsersByLocation(locationId);
  }

  @Get('users/without-location')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get users without location',
    description: 'Get list of user IDs that don\'t have location assignments. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user IDs without location assignments',
    schema: {
      type: 'array',
      items: { type: 'number' },
      example: [1, 5, 10],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUsersWithoutLocation() {
    return await this.userLocationService.getUsersWithoutLocation();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user location by ID',
    description: 'Retrieve a specific user location assignment by its ID.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'User location ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User location assignment details',
    type: UserLocationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User location not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.userLocationService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Update user location assignment',
    description: 'Update an existing user location assignment. Requires admin role.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'User location ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Location assignment updated successfully',
    type: UserLocationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User location or new location not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserLocationDto: UpdateUserLocationDto,
  ) {
    return await this.userLocationService.update(id, updateUserLocationDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Remove user location assignment',
    description: 'Remove a user location assignment. Requires admin role.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'User location ID' })
  @ApiResponse({ status: 204, description: 'Location assignment removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User location not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.userLocationService.remove(id);
  }

  @Post('assign')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Assign or update user location',
    description: 'Assign a location to a user or update existing assignment. Creates new if none exists, updates if exists. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Location assigned/updated successfully',
    type: UserLocationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User or location not found' })
  async assignUserToLocation(@Body() body: { userId: number; locationId: number; createdBy?: string }) {
    return await this.userLocationService.assignUserToLocation(
      body.userId, 
      body.locationId, 
      body.createdBy
    );
  }
}