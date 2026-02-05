import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ConfigItem } from '../entities/config-item.entity';
import { User } from '../entities/user.entity';
import {
  CreateConfigItemDto,
  UpdateConfigItemDto,
  ConfigItemResponseDto,
} from '../dto/config.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import {
  ApiResponse,
  ResponseFactory,
} from '../interfaces/api-response.interface';
import { DebugLogger } from '../lib/debug-logger';

interface UserInfo {
  id?: number;
  email?: string;
  name?: string;
  role?: string;
}

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(ConfigItem)
    private configItemRepository: Repository<ConfigItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createConfigItemDto: CreateConfigItemDto,
    userInfo?: UserInfo,
  ): Promise<any> {
    try {
      // Check for duplicate key within the same group
      const existingKeyItem = await this.configItemRepository.findOne({
        where: {
          group: createConfigItemDto.group,
          key: createConfigItemDto.key,
        },
      });

      if (existingKeyItem) {
        return {
          success: false,
          message: `${ERROR_MESSAGES.DUPLICATE_ENTRY}: Key already exists in this group`,
          error: 'DUPLICATE_KEY',
          data: {
            group: createConfigItemDto.group,
            key: createConfigItemDto.key,
            existingId: existingKeyItem.id,
            existingValue: existingKeyItem.value,
          },
        };
      }

      // Check for duplicate value within the same group
      const existingValueItem = await this.configItemRepository.findOne({
        where: {
          group: createConfigItemDto.group,
          value: createConfigItemDto.value,
        },
      });

      if (existingValueItem) {
        return {
          success: false,
          message: `${ERROR_MESSAGES.DUPLICATE_ENTRY}: Value already exists in this group`,
          error: 'DUPLICATE_VALUE',
          data: {
            group: createConfigItemDto.group,
            value: createConfigItemDto.value,
            existingId: existingValueItem.id,
            existingKey: existingValueItem.key,
          },
        };
      }

      const configItem = this.configItemRepository.create({
        ...createConfigItemDto,
        isActive: createConfigItemDto.isActive ?? true, // Default to true if not provided
        order: createConfigItemDto.order ?? 0, // Default to 0 if not provided
        createdBy: userInfo?.email || userInfo?.name || 'system',
        updatedBy: userInfo?.email || userInfo?.name || 'system',
      });

      const savedItem = await this.configItemRepository.save(configItem);
      return {
        success: true,
        message: 'Config item created successfully',
        data: savedItem,
      };
    } catch (error) {
      DebugLogger.error(
        'ConfigService',
        'Config creation error',
        error.message,
      );
      return {
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: 'DATABASE_ERROR',
        data: {
          group: createConfigItemDto.group,
          key: createConfigItemDto.key,
          originalError: error.message,
        },
      };
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    group?: string,
    sortBy: string = 'group',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ) {
    const skip = (page - 1) * limit;
    const whereCondition: any = {
      isActive: true, // Only show active config items
    };

    if (group) {
      whereCondition.group = group;
    }

    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = [
      'group',
      'key',
      'value',
      'order',
      'createdAt',
      'updatedAt',
    ];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'group';
    const validSortOrder =
      sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'ASC';

    // Build order object
    const orderOptions: any = {};
    orderOptions[validSortBy] = validSortOrder;

    // Add secondary sort by key for consistent ordering
    if (validSortBy !== 'key') {
      orderOptions.key = 'ASC';
    }

    const [configItems, total] = await this.configItemRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: orderOptions,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: configItems,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<ConfigItemResponseDto> {
    const configItem = await this.configItemRepository.findOne({
      where: { id },
    });

    if (!configItem) {
      throw new NotFoundException({
        message: ERROR_MESSAGES.RECORD_NOT_FOUND,
        error: 'CONFIG_ITEM_NOT_FOUND',
        data: { id },
      });
    }

    return configItem;
  }

  async update(
    id: number,
    updateConfigItemDto: UpdateConfigItemDto,
    userInfo?: UserInfo,
  ): Promise<any> {
    try {
      const configItem = await this.configItemRepository.findOne({
        where: { id },
      });

      if (!configItem) {
        return {
          success: false,
          message: ERROR_MESSAGES.RECORD_NOT_FOUND,
          error: 'CONFIG_ITEM_NOT_FOUND',
          data: { id },
        };
      }

      // Check for duplicate key within the same group if key or group is being updated
      if (updateConfigItemDto.key || updateConfigItemDto.group) {
        const group = updateConfigItemDto.group || configItem.group;
        const key = updateConfigItemDto.key || configItem.key;

        const existingKeyItem = await this.configItemRepository.findOne({
          where: { group, key },
        });

        if (existingKeyItem && existingKeyItem.id !== id) {
          return {
            success: false,
            message: `${ERROR_MESSAGES.DUPLICATE_ENTRY}: Key already exists in this group`,
            error: 'DUPLICATE_KEY',
            data: {
              id,
              group,
              key,
              existingId: existingKeyItem.id,
              existingValue: existingKeyItem.value,
            },
          };
        }
      }

      // Check for duplicate value within the same group if value or group is being updated
      if (updateConfigItemDto.value || updateConfigItemDto.group) {
        const group = updateConfigItemDto.group || configItem.group;
        const value = updateConfigItemDto.value || configItem.value;

        const existingValueItem = await this.configItemRepository.findOne({
          where: { group, value },
        });

        if (existingValueItem && existingValueItem.id !== id) {
          return {
            success: false,
            message: `${ERROR_MESSAGES.DUPLICATE_ENTRY}: Value already exists in this group`,
            error: 'DUPLICATE_VALUE',
            data: {
              id,
              group,
              value,
              existingId: existingValueItem.id,
              existingKey: existingValueItem.key,
            },
          };
        }
      }

      await this.configItemRepository.update(id, {
        ...updateConfigItemDto,
        updatedBy: userInfo?.email || userInfo?.name || 'system',
      });
      const updatedItem = await this.configItemRepository.findOne({
        where: { id },
      });
      return {
        success: true,
        message: 'Config item updated successfully',
        data: updatedItem,
      };
    } catch (error) {
      DebugLogger.error('ConfigService', 'Config update error', error.message);
      return {
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: 'DATABASE_ERROR',
        data: {
          id,
          updateData: updateConfigItemDto,
          originalError: error.message,
        },
      };
    }
  }

  async remove(id: number) {
    try {
      const configItem = await this.configItemRepository.findOne({
        where: { id },
      });

      if (!configItem) {
        throw new NotFoundException({
          message: ERROR_MESSAGES.RECORD_NOT_FOUND,
          error: 'CONFIG_ITEM_NOT_FOUND',
          data: { id },
        });
      }

      await this.configItemRepository.remove(configItem);
      return {
        message: SUCCESS_MESSAGES.DELETED('Configuration item'),
        data: {
          id,
          group: configItem.group,
          key: configItem.key,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      DebugLogger.error(
        'ConfigService',
        'Config deletion error',
        error.message,
      );
      throw new BadRequestException({
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: 'DATABASE_ERROR',
        data: {
          id,
          originalError: error.message,
        },
      });
    }
  }

  async findByGroup(group: string): Promise<ConfigItem[]> {
    return this.configItemRepository.find({
      where: { group },
      order: { key: 'ASC' },
    });
  }

  async getLocations(): Promise<ConfigItem[]> {
    return this.configItemRepository.find({
      where: { group: 'locations' },
      order: { order: 'ASC', key: 'ASC' },
    });
  }

  async getServices(): Promise<ConfigItem[]> {
    return this.configItemRepository.find({
      where: { group: 'services' },
      order: { order: 'ASC', key: 'ASC' },
    });
  }

  /**
   * Get locations based on user's assigned permissions
   */
  async getLocationsForUser(userId: number, userRole: string): Promise<ConfigItem[]> {
    // Superadmin sees all locations
    if (userRole === 'superadmin') {
      return this.getLocations();
    }

    // Get user info
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allLocations = await this.getLocations();

    // Filter locations based on user's locationKey
    if (
      user.locationKey &&
      user.locationKey !== 'all_locations' &&
      !user.locationKey.startsWith('all_')
    ) {
      // User has specific location - only show that location
      return allLocations.filter((loc) => loc.key === user.locationKey);
    }

    // User has all_locations or null - show all locations
    return allLocations;
  }

  /**
   * Get services based on user's assigned permissions
   */
  async getServicesForUser(userId: number, userRole: string): Promise<ConfigItem[]> {
    // Superadmin sees all services
    if (userRole === 'superadmin') {
      return this.getServices();
    }

    // Get user info
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allServices = await this.getServices();

    // Filter services based on user's serviceKey
    if (
      user.serviceKey &&
      user.serviceKey !== 'all_services' &&
      !user.serviceKey.startsWith('all_')
    ) {
      // User has specific service - only show that service
      return allServices.filter((svc) => svc.key === user.serviceKey);
    }

    // User has all_services or null - show all services
    return allServices;
  }

  async getServicesForPublicUser(): Promise<ConfigItem[]> {
    return this.configItemRepository.find({
      where: {
        group: 'services',
        isActive: true,
        isDisplayToUser: true,
      },
      order: { order: 'ASC', key: 'ASC' },
    });
  }

  async getMappings(): Promise<any> {
    const locations = await this.getLocations();
    const services = await this.getServices();

    const locationMapping = locations.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    const serviceMapping = services.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return {
      locations: {
        mapping: locationMapping,
        options: locations.map((item) => ({
          key: item.key,
          value: item.value,
          description: item.description,
          order: item.order,
        })),
      },
      services: {
        mapping: serviceMapping,
        options: services.map((item) => ({
          key: item.key,
          value: item.value,
          description: item.description,
          order: item.order,
        })),
      },
    };
  }

  /**
   * Get filter options (locations and services) based on user's assigned permissions
   * Used for admin panel dropdowns
   */
  async getFilterOptionsForUser(
    userId: number,
    userRole: string,
  ): Promise<any> {
    // Superadmin sees all options
    if (userRole === 'superadmin') {
      return this.getMappings();
    }

    // Get user info
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    const allMappings = await this.getMappings();

    // Filter locations based on user's locationKey
    let availableLocations = allMappings.locations.options;
    if (
      user.locationKey &&
      user.locationKey !== 'all_locations' &&
      !user.locationKey.startsWith('all_')
    ) {
      // User has specific location - only show that location
      availableLocations = allMappings.locations.options.filter(
        (loc) => loc.key === user.locationKey,
      );
    }
    // else: user has all_locations or null - show all locations

    // Filter services based on user's serviceKey
    let availableServices = allMappings.services.options;
    if (
      user.serviceKey &&
      user.serviceKey !== 'all_services' &&
      !user.serviceKey.startsWith('all_')
    ) {
      // User has specific service - only show that service
      availableServices = allMappings.services.options.filter(
        (svc) => svc.key === user.serviceKey,
      );
    }
    // else: user has all_services or null - show all services

    // Rebuild mappings with filtered options
    const locationMapping = availableLocations.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    const serviceMapping = availableServices.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return {
      locations: {
        mapping: locationMapping,
        options: availableLocations,
      },
      services: {
        mapping: serviceMapping,
        options: availableServices,
      },
    };
  }

  async findByKey(group: string, key: string): Promise<ConfigItem | null> {
    return this.configItemRepository.findOne({
      where: { group, key },
    });
  }

  async getAllGroups(): Promise<string[]> {
    const result = await this.configItemRepository
      .createQueryBuilder('config')
      .select('DISTINCT config.group', 'group')
      .orderBy('config.group', 'ASC')
      .getRawMany();

    return result.map((item) => item.group);
  }
}
