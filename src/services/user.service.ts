import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserQuizAssignment } from '../entities/user-quiz-assignment.entity';
import { ConfigItem } from '../entities/config-item.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserDetailResponseDto,
  UserRole,
} from '../dto/user.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, DEFAULTS } from '../constants';
import { AutoAssignmentService } from './auto-assignment.service';
import { ConfigService } from './config.service';

interface UserInfo {
  id?: number;
  email?: string;
  name?: string;
  role?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserQuizAssignment)
    private userQuizAssignmentRepository: Repository<UserQuizAssignment>,
    @InjectRepository(ConfigItem)
    private configItemRepository: Repository<ConfigItem>,
    private autoAssignmentService: AutoAssignmentService,
    private configService: ConfigService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    userInfo?: UserInfo,
  ): Promise<any> {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        return {
          success: false,
          message: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
          error: 'EMAIL_ALREADY_EXISTS',
          data: {
            email: createUserDto.email,
            existingUserId: existingUser.id,
          },
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user - exclude service/location objects, use only keys
      const { service, location, ...userCreateData } = createUserDto;
      const user = this.userRepository.create({
        ...userCreateData,
        password: hashedPassword,
        role: (createUserDto.role || (DEFAULTS.USER_ROLE as UserRole)) as
          | 'admin'
          | 'user',
        locationKey: createUserDto.locationKey,
        serviceKey: createUserDto.serviceKey,
        isActive: createUserDto.isActive ?? true, // Default to true if not provided
        createdBy: userInfo?.email || userInfo?.name || 'system',
        updatedBy: userInfo?.email || userInfo?.name || 'system',
      });

      const savedUser = await this.userRepository.save(user);

      // Auto-assign to quizzes based on service and location (for admin users)
      if (
        (createUserDto.serviceKey || createUserDto.locationKey) &&
        savedUser.role === 'admin'
      ) {
        // Auto-assign user to all existing quizzes matching their service and location
        await this.autoAssignmentService.updateUserServiceLocationAssignments(
          savedUser.id,
          createUserDto.serviceKey,
          createUserDto.locationKey,
          null, // No old service since this is new user
          null, // No old location since this is new user
        );
      }

      // Get auto-assigned quizzes for admin users
      let assignedQuizzes = [];
      if (savedUser.role === 'admin') {
        const quizAssignments = await this.userQuizAssignmentRepository.find({
          where: { userId: savedUser.id, isActive: true },
          relations: ['quiz'],
          order: { createdAt: 'DESC' },
        });

        assignedQuizzes = quizAssignments.map((assignment) => ({
          id: assignment.quiz.id,
          title: assignment.quiz.title,
          description: assignment.quiz.description,
          serviceType: assignment.quiz.serviceType,
          quizType: assignment.quiz.quizType,
          isActive: assignment.quiz.isActive,
          startDateTime: assignment.quiz.startDateTime,
          endDateTime: assignment.quiz.endDateTime,
          createdAt: assignment.quiz.createdAt,
          assignmentType:
            assignment.assignedBy === 'system' ? 'auto' : 'manual',
        }));
      }

      // Return user without password
      const { password, ...result } = savedUser;
      return {
        success: true,
        message: 'User created successfully',
        data: {
          ...result,
          role: result.role as UserRole,
          assignedQuizzes,
        },
      };
    } catch (error) {
      console.error('User creation error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.USER_CREATION_FAILED,
        error: 'USER_CREATION_FAILED',
        data: {
          email: createUserDto.email,
          originalError: error.message,
        },
      };
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    serviceKey?: string,
    locationKey?: string,
    role?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{
    items: UserResponseDto[];
    pagination: {
      currentPage: number;
      totalPages: number;
      pageSize: number;
      totalItems: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const skip = (page - 1) * limit;

    // Use query builder for filtering (no joins needed with key-based storage)
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.serviceKey',
        'user.locationKey',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.isActive = :isActive', { isActive: true });

    // Add service filter (ignore "all_services" and similar values)
    if (
      serviceKey &&
      serviceKey !== 'all_services' &&
      !serviceKey.startsWith('all_')
    ) {
      queryBuilder.andWhere('user.serviceKey = :serviceKey', { serviceKey });
    }

    // Add location filter (ignore "all_locations" and similar values)
    if (
      locationKey &&
      locationKey !== 'all_locations' &&
      !locationKey.startsWith('all_')
    ) {
      queryBuilder.andWhere('user.locationKey = :locationKey', { locationKey });
    }

    // Add role filter - use exact match for enum field
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Add search conditions with LIKE UPPER
    if (search) {
      queryBuilder.andWhere(
        '(UPPER(user.name) LIKE UPPER(:search) OR UPPER(user.email) LIKE UPPER(:search))',
        { search: `%${search}%` },
      );
    }

    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = [
      'name',
      'email',
      'role',
      'createdAt',
      'updatedAt',
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const validSortOrder =
      sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'DESC';

    const [users, total] = await queryBuilder
      .orderBy(`user.${validSortBy}`, validSortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    // Get config items for display
    const serviceConfigs = await this.configItemRepository.find({
      where: { group: 'services' },
    });
    const locationConfigs = await this.configItemRepository.find({
      where: { group: 'locations' },
    });

    return {
      items: users.map((user) => {
        const serviceConfig = user.serviceKey
          ? serviceConfigs.find((s) => s.key === user.serviceKey)
          : null;
        const locationConfig = user.locationKey
          ? locationConfigs.find((l) => l.key === user.locationKey)
          : null;

        return {
          ...user,
          role: user.role as UserRole,
          service: serviceConfig
            ? {
                id: serviceConfig.id,
                key: serviceConfig.key,
                value: serviceConfig.value,
              }
            : null,
          location: locationConfig
            ? {
                id: locationConfig.id,
                key: locationConfig.key,
                value: locationConfig.value,
              }
            : null,
        };
      }),
      pagination,
    };
  }

  async findOne(id: number): Promise<UserDetailResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'name',
        'email',
        'role',
        'serviceKey',
        'locationKey',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Get config items for service and location if they exist
    let serviceConfig = null;
    let locationConfig = null;

    if (user.serviceKey) {
      serviceConfig = await this.configItemRepository.findOne({
        where: { group: 'services', key: user.serviceKey },
      });
    }

    if (user.locationKey) {
      locationConfig = await this.configItemRepository.findOne({
        where: { group: 'locations', key: user.locationKey },
      });
    }

    let assignedQuizzes = [];

    // Only load assigned quizzes for admin users (not superadmin or regular users)
    if (user.role === 'admin') {
      const assignments = await this.userQuizAssignmentRepository.find({
        where: { userId: id, isActive: true },
        relations: ['quiz'],
        order: { createdAt: 'DESC' },
      });

      assignedQuizzes = assignments.map((assignment) => ({
        id: assignment.quiz.id,
        title: assignment.quiz.title,
        description: assignment.quiz.description,
        serviceType: assignment.quiz.serviceType,
        quizType: assignment.quiz.quizType,
        isActive: assignment.quiz.isActive,
        startDateTime: assignment.quiz.startDateTime,
        endDateTime: assignment.quiz.endDateTime,
        createdAt: assignment.quiz.createdAt,
      }));
    }

    return {
      ...user,
      role: user.role as UserRole,
      service: serviceConfig
        ? {
            id: serviceConfig.id,
            key: serviceConfig.key,
            value: serviceConfig.value,
          }
        : null,
      location: locationConfig
        ? {
            id: locationConfig.id,
            key: locationConfig.key,
            value: locationConfig.value,
          }
        : null,
      assignedQuizzes,
    };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    userInfo?: UserInfo,
  ): Promise<UserDetailResponseDto> {
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

    // Prepare update data
    const userData = updateUserDto;

    // Handle service and location change for auto-assignment
    const oldServiceKey = user.serviceKey;
    const oldLocationKey = user.locationKey;
    const newServiceKey = userData.serviceKey;
    const newLocationKey = userData.locationKey;

    // Update user
    const updateData: Partial<User> = {
      ...userData,
      role: userData.role as 'admin' | 'user' | undefined,
      updatedBy: userInfo?.email || userInfo?.name || 'system',
    };

    await this.userRepository.update(id, updateData);

    // Handle auto-assignment based on service/location change (for admin users only)
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    if (
      updatedUser?.role === 'admin' &&
      (oldServiceKey !== newServiceKey || oldLocationKey !== newLocationKey)
    ) {
      await this.autoAssignmentService.updateUserServiceLocationAssignments(
        id,
        newServiceKey,
        newLocationKey,
        oldServiceKey,
        oldLocationKey,
      );
    }

    // Auto-assignment will be handled by the service/location change logic above
    // No manual assignment handling needed since we use auto-assignment only

    // Location assignment now handled via UserQuizAssignment system
    // if (updateUserDto.locationId !== undefined) {
    //   // Remove existing location
    //   await this.userLocationRepository.delete({ userId: id });

    //   // Add new location if provided
    //   if (updateUserDto.locationId) {
    //     const location = await this.configItemRepository.findOne({
    //       where: { id: updateUserDto.locationId, group: 'location' },
    //     });

    //     if (location) {
    //       const userLocation = this.userLocationRepository.create({
    //         userId: id,
    //         locationId: updateUserDto.locationId,
    //       });
    //       await this.userLocationRepository.save(userLocation);
    //     }
    //   }
    // }

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
      select: [
        'id',
        'name',
        'email',
        'password',
        'role',
        'createdAt',
        'updatedAt',
        'lastLogin',
        'isActive',
      ],
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async findAllWithDisplayNames(
    page: number = 1,
    limit: number = 10,
    search?: string,
    serviceKey?: string,
    locationKey?: string,
    role?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    // Get user data using existing method
    const userData = await this.findAll(
      page,
      limit,
      search,
      serviceKey,
      locationKey,
      role,
      sortBy,
      sortOrder,
    );

    // Get config mappings
    const mappings = await this.configService.getMappings();

    // Enhance user data with display names
    const enhancedUsers = userData.items.map((user) => ({
      ...user,
      serviceName: user.serviceKey
        ? mappings.services.mapping[user.serviceKey] || user.serviceKey
        : null,
      locationName: user.locationKey
        ? mappings.locations.mapping[user.locationKey] || user.locationKey
        : null,
    }));

    return {
      items: enhancedUsers,
      pagination: userData.pagination,
    };
  }
}
