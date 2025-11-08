import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLocation } from '../entities/user-location.entity';
import { User } from '../entities/user.entity';
import { ConfigItem } from '../entities/config-item.entity';
import { CreateUserLocationDto, UpdateUserLocationDto } from '../dto/user-location.dto';

@Injectable()
export class UserLocationService {
  constructor(
    @InjectRepository(UserLocation)
    private userLocationRepository: Repository<UserLocation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ConfigItem)
    private configItemRepository: Repository<ConfigItem>,
  ) {}

  async create(createUserLocationDto: CreateUserLocationDto): Promise<UserLocation> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: createUserLocationDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createUserLocationDto.userId} not found`);
    }

    // Verify location exists and is a location type
    const location = await this.configItemRepository.findOne({
      where: { 
        id: createUserLocationDto.locationId,
        group: 'location'
      },
    });

    if (!location) {
      throw new NotFoundException(
        `Location with ID ${createUserLocationDto.locationId} not found in location group`
      );
    }

    // Check if user already has a location assignment
    const existingLocation = await this.userLocationRepository.findOne({
      where: { userId: createUserLocationDto.userId },
    });

    if (existingLocation) {
      throw new BadRequestException(
        `User ${createUserLocationDto.userId} already has a location assignment. Use update instead.`
      );
    }

    const userLocation = this.userLocationRepository.create({
      ...createUserLocationDto,
      isActive: createUserLocationDto.isActive ?? true,
    });

    return await this.userLocationRepository.save(userLocation);
  }

  async findAll(): Promise<UserLocation[]> {
    return await this.userLocationRepository.find({
      relations: ['user', 'location'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: number): Promise<UserLocation | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return await this.userLocationRepository.findOne({
      where: { userId },
      relations: ['user', 'location'],
    });
  }

  async findByLocationId(locationId: number): Promise<UserLocation[]> {
    const location = await this.configItemRepository.findOne({ 
      where: { id: locationId, group: 'location' } 
    });
    
    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    return await this.userLocationRepository.find({
      where: { locationId },
      relations: ['user', 'location'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<UserLocation> {
    const userLocation = await this.userLocationRepository.findOne({
      where: { id },
      relations: ['user', 'location'],
    });

    if (!userLocation) {
      throw new NotFoundException(`User location with ID ${id} not found`);
    }

    return userLocation;
  }

  async update(id: number, updateUserLocationDto: UpdateUserLocationDto): Promise<UserLocation> {
    const userLocation = await this.findOne(id);

    // If updating location, verify it exists and is a location type
    if (updateUserLocationDto.locationId) {
      const location = await this.configItemRepository.findOne({
        where: { 
          id: updateUserLocationDto.locationId,
          group: 'location'
        },
      });

      if (!location) {
        throw new NotFoundException(
          `Location with ID ${updateUserLocationDto.locationId} not found in location group`
        );
      }
    }

    Object.assign(userLocation, updateUserLocationDto);
    return await this.userLocationRepository.save(userLocation);
  }

  async remove(id: number): Promise<void> {
    const userLocation = await this.findOne(id);
    await this.userLocationRepository.remove(userLocation);
  }

  async removeByUserId(userId: number): Promise<void> {
    const userLocation = await this.findByUserId(userId);
    if (userLocation) {
      await this.userLocationRepository.remove(userLocation);
    }
  }

  async assignUserToLocation(userId: number, locationId: number, createdBy?: string): Promise<UserLocation> {
    // Check if user already has a location
    const existingLocation = await this.findByUserId(userId);
    
    if (existingLocation) {
      // Update existing location
      return await this.update(existingLocation.id, { 
        locationId, 
        isActive: true,
        updatedBy: createdBy 
      });
    } else {
      // Create new location assignment
      return await this.create({ 
        userId, 
        locationId, 
        isActive: true,
        createdBy 
      });
    }
  }

  async getActiveUsersByLocation(locationId: number): Promise<UserLocation[]> {
    return await this.userLocationRepository.find({
      where: { 
        locationId, 
        isActive: true 
      },
      relations: ['user', 'location'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUsersWithoutLocation(): Promise<number[]> {
    // Get all user IDs that don't have location assignments
    const usersWithLocation = await this.userLocationRepository.find({
      select: ['userId'],
    });

    const userIdsWithLocation = usersWithLocation.map(ul => ul.userId);
    
    const allUsers = await this.userRepository.find({
      select: ['id'],
    });

    return allUsers
      .filter(user => !userIdsWithLocation.includes(user.id))
      .map(user => user.id);
  }
}