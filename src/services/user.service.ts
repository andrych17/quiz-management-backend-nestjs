import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserQuizAssignment } from '../entities/user-quiz-assignment.entity';
import { ConfigItem } from '../entities/config-item.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto, UserDetailResponseDto, UserRole } from '../dto/user.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, DEFAULTS } from '../constants';
import { AutoAssignmentService } from './auto-assignment.service';

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
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDetailResponseDto> {
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
        locationId: createUserDto.locationId,
        serviceId: createUserDto.serviceId,
      });

      const savedUser = await this.userRepository.save(user);

      // Auto-assign to quizzes based on service and location (for admin users)
      if ((createUserDto.serviceId || createUserDto.locationId) && savedUser.role === 'admin') {
        // Auto-assign user to all existing quizzes matching their service and location
        await this.autoAssignmentService.updateUserServiceLocationAssignments(
          savedUser.id,
          createUserDto.serviceId,
          createUserDto.locationId,
          null, // No old service since this is new user
          null  // No old location since this is new user
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

        assignedQuizzes = quizAssignments.map(assignment => ({
          id: assignment.quiz.id,
          title: assignment.quiz.title,
          description: assignment.quiz.description,
          serviceType: assignment.quiz.serviceType,
          quizType: assignment.quiz.quizType,
          isActive: assignment.quiz.isActive,
          startDateTime: assignment.quiz.startDateTime,
          endDateTime: assignment.quiz.endDateTime,
          createdAt: assignment.quiz.createdAt,
          assignmentType: assignment.assignedBy === 'system' ? 'auto' : 'manual',
        }));
      }

      // Return user without password
      const { password, ...result } = savedUser;
      return {
        ...result,
        role: result.role as UserRole,
        assignedQuizzes,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.USER_CREATION_FAILED);
    }
  }

  async findAll(page: number = 1, limit: number = 10, search?: string): Promise<{ items: UserResponseDto[], pagination: { currentPage: number, totalPages: number, pageSize: number, totalItems: number, hasNext: boolean, hasPrevious: boolean } }> {
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
    });

    const totalPages = Math.ceil(total / limit);
    
    const pagination = {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    return {
      items: users.map(user => ({
        ...user,
        role: user.role as UserRole,
      })),
      pagination,
    };
  }

  async findOne(id: number): Promise<UserDetailResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    let assignedQuizzes = [];

    // Only load assigned quizzes for admin users (not superadmin or regular users)
    if (user.role === 'admin') {
      const assignments = await this.userQuizAssignmentRepository.find({
        where: { userId: id, isActive: true },
        relations: ['quiz'],
        order: { createdAt: 'DESC' },
      });

      assignedQuizzes = assignments.map(assignment => ({
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
      assignedQuizzes,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserDetailResponseDto> {
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
    const oldServiceId = user.serviceId;
    const oldLocationId = user.locationId;
    const newServiceId = userData.serviceId;
    const newLocationId = userData.locationId;

    // Update user
    const updateData: Partial<User> = {
      ...userData,
      role: userData.role as 'admin' | 'user' | undefined,
    };
    
    await this.userRepository.update(id, updateData);

    // Handle auto-assignment based on service/location change (for admin users only)
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    if (updatedUser?.role === 'admin' && 
        (oldServiceId !== newServiceId || oldLocationId !== newLocationId)) {
      await this.autoAssignmentService.updateUserServiceLocationAssignments(
        id,
        newServiceId,
        newLocationId,
        oldServiceId,
        oldLocationId
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
      select: ['id', 'name', 'email', 'password', 'role', 'createdAt', 'updatedAt', 'lastLogin', 'isActive']
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}