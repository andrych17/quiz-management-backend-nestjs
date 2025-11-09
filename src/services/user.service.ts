import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserLocation } from '../entities/user-location.entity';
import { ConfigItem } from '../entities/config-item.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto, UserRole } from '../dto/user.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, DEFAULTS } from '../constants';
import { ApiResponse, ResponseFactory } from '../interfaces/api-response.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserLocation)
    private userLocationRepository: Repository<UserLocation>,
    @InjectRepository(ConfigItem)
    private configItemRepository: Repository<ConfigItem>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user
      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        role: (createUserDto.role || DEFAULTS.USER_ROLE as UserRole) as 'admin' | 'user',
      });

      const savedUser = await this.userRepository.save(user);

      // Assign location if provided
      if (createUserDto.locationId) {
        const location = await this.configItemRepository.findOne({
          where: { id: createUserDto.locationId, group: 'location' },
        });

        if (location) {
          const userLocation = this.userLocationRepository.create({
            userId: savedUser.id,
            locationId: createUserDto.locationId,
          });
          await this.userLocationRepository.save(userLocation);
        }
      }

      // Return user without password
      const { password, ...result } = savedUser;
      return {
        ...result,
        role: result.role as UserRole,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.USER_CREATION_FAILED);
    }
  }

  async findAll(page: number = 1, limit: number = 10, search?: string): Promise<ApiResponse<any>> {
    const skip = (page - 1) * limit;
    const whereCondition = search
      ? [
          { name: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
        ]
      : {};

    const [users, total] = await this.userRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      select: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      relations: ['location', 'location.location'],
    });

    return ResponseFactory.paginated(
      users,
      total,
      page,
      limit,
      search ? `Found ${total} users matching "${search}"` : 'Users retrieved successfully'
    );
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      relations: ['location', 'location.location'],
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Check if email is being updated and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    const updateData: Partial<User> = {
      ...updateUserDto,
      role: updateUserDto.role as 'admin' | 'user' | undefined,
    };
    
    await this.userRepository.update(id, updateData);

    // Update location if provided
    if (updateUserDto.locationId !== undefined) {
      // Remove existing location
      await this.userLocationRepository.delete({ userId: id });

      // Add new location if provided
      if (updateUserDto.locationId) {
        const location = await this.configItemRepository.findOne({
          where: { id: updateUserDto.locationId, group: 'location' },
        });

        if (location) {
          const userLocation = this.userLocationRepository.create({
            userId: id,
            locationId: updateUserDto.locationId,
          });
          await this.userLocationRepository.save(userLocation);
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await this.userRepository.remove(user);
    return { message: SUCCESS_MESSAGES.USER_DELETED };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'name', 'email', 'password', 'role', 'createdAt', 'updatedAt', 'lastLogin', 'isActive']
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}