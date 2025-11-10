import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ConfigItem } from '../entities/config-item.entity';
import { CreateConfigItemDto, UpdateConfigItemDto, ConfigItemResponseDto } from '../dto/config.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { ApiResponse, ResponseFactory } from '../interfaces/api-response.interface';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(ConfigItem)
    private configItemRepository: Repository<ConfigItem>,
  ) {}

  async create(createConfigItemDto: CreateConfigItemDto): Promise<ConfigItemResponseDto> {
    try {
      // Check for duplicate key within the same group
      const existingItem = await this.configItemRepository.findOne({
        where: {
          group: createConfigItemDto.group,
          key: createConfigItemDto.key,
        },
      });

      if (existingItem) {
        throw new BadRequestException(ERROR_MESSAGES.DUPLICATE_ENTRY);
      }

      const configItem = this.configItemRepository.create(createConfigItemDto);
      return await this.configItemRepository.save(configItem);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  async findAll(
    page: number = 1, 
    limit: number = 10, 
    group?: string,
    sortBy: string = 'group',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ) {
    const skip = (page - 1) * limit;
    const whereCondition: any = {};

    if (group) {
      whereCondition.group = group;
    }

    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = ['group', 'key', 'value', 'order', 'createdAt', 'updatedAt'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'group';
    const validSortOrder = sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'ASC';

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
      }
    };
  }

  async findOne(id: number): Promise<ConfigItemResponseDto> {
    const configItem = await this.configItemRepository.findOne({
      where: { id },
    });

    if (!configItem) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    return configItem;
  }

  async update(id: number, updateConfigItemDto: UpdateConfigItemDto): Promise<ConfigItemResponseDto> {
    const configItem = await this.configItemRepository.findOne({ where: { id } });

    if (!configItem) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    // Check for duplicate key within the same group if key or group is being updated
    if (updateConfigItemDto.key || updateConfigItemDto.group) {
      const group = updateConfigItemDto.group || configItem.group;
      const key = updateConfigItemDto.key || configItem.key;

      const existingItem = await this.configItemRepository.findOne({
        where: { group, key },
      });

      if (existingItem && existingItem.id !== id) {
        throw new BadRequestException(ERROR_MESSAGES.DUPLICATE_ENTRY);
      }
    }

    await this.configItemRepository.update(id, updateConfigItemDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const configItem = await this.configItemRepository.findOne({ where: { id } });

    if (!configItem) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    await this.configItemRepository.remove(configItem);
    return { message: SUCCESS_MESSAGES.DELETED('Configuration item') };
  }

  async findByGroup(group: string): Promise<ConfigItem[]> {
    return this.configItemRepository.find({
      where: { group },
      order: { key: 'ASC' },
    });
  }

  async getLocations(): Promise<ConfigItem[]> {
    return this.configItemRepository.find({
      where: { group: 'location' },
      order: { order: 'ASC', key: 'ASC' },
    });
  }

  async getServices(): Promise<ConfigItem[]> {
    return this.configItemRepository.find({
      where: { group: 'service' },
      order: { order: 'ASC', key: 'ASC' },
    });
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

    return result.map(item => item.group);
  }
}