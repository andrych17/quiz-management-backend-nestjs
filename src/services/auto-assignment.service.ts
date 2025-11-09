import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserQuizAssignment } from '../entities/user-quiz-assignment.entity';
import { ConfigItem } from '../entities/config-item.entity';

@Injectable()
export class AutoAssignmentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserQuizAssignment)
    private readonly userQuizAssignmentRepository: Repository<UserQuizAssignment>,
    @InjectRepository(ConfigItem)
    private readonly configItemRepository: Repository<ConfigItem>,
  ) {}

  /**
   * Auto-assign admin users to a quiz based on service and location
   */
  async autoAssignUsersToQuiz(
    quizId: number, 
    serviceId: number | null,
    locationId: number | null, 
    createdBy?: string
  ): Promise<UserQuizAssignment[]> {
    // Find matching admin users based on service and location
    const adminUsers = await this.getMatchingAdminUsers(serviceId, locationId);

    if (adminUsers.length === 0) {
      return []; // No matching admin users found
    }

    const assignments: UserQuizAssignment[] = [];

    for (const user of adminUsers) {
      // Check if assignment already exists
      const existingAssignment = await this.userQuizAssignmentRepository.findOne({
        where: {
          userId: user.id,
          quizId: quizId,
        },
      });

      if (!existingAssignment) {
        // Create new assignment
        const assignment = this.userQuizAssignmentRepository.create({
          userId: user.id,
          quizId: quizId,
          isActive: true,
          assignedBy: createdBy || 'system',
          notes: `Auto-assigned based on service/location match (serviceId: ${serviceId}, locationId: ${locationId})`,
        });

        const savedAssignment = await this.userQuizAssignmentRepository.save(assignment);
        assignments.push(savedAssignment);
      }
    }

    return assignments;
  }

  /**
   * Get matching admin users based on service and location filtering
   */
  async getMatchingAdminUsers(
    serviceId: number | null, 
    locationId: number | null
  ): Promise<User[]> {
    // Get "all_services" config item ID for superadmin check
    const allServicesConfig = await this.configItemRepository.findOne({
      where: { group: 'service', key: 'all_services' }
    });

    // Get "all_locations" config item ID for superadmin check (if exists)
    const allLocationsConfig = await this.configItemRepository.findOne({
      where: { group: 'location', key: 'all_locations' }
    });

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: 'admin' })
      .andWhere('user.isActive = :isActive', { isActive: true });

    // Service filtering logic
    if (serviceId) {
      queryBuilder.andWhere(
        '(user.serviceId = :serviceId OR user.serviceId = :allServicesId)',
        { 
          serviceId, 
          allServicesId: allServicesConfig?.id || null 
        }
      );
    } else {
      // If no serviceId specified, only superadmin with all_services can see
      queryBuilder.andWhere('user.serviceId = :allServicesId', { 
        allServicesId: allServicesConfig?.id || null 
      });
    }

    // Location filtering logic
    if (locationId) {
      const locationFilter = allLocationsConfig 
        ? '(user.locationId = :locationId OR user.locationId = :allLocationsId)'
        : 'user.locationId = :locationId';
      
      queryBuilder.andWhere(locationFilter, {
        locationId,
        allLocationsId: allLocationsConfig?.id || null
      });
    } else if (allLocationsConfig) {
      // If no locationId specified, only superadmin with all_locations can see
      queryBuilder.andWhere('user.locationId = :allLocationsId', { 
        allLocationsId: allLocationsConfig.id 
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get admin users for a specific service and location
   */
  async getAdminUsersForServiceAndLocation(
    serviceId: number | null, 
    locationId: number | null
  ): Promise<User[]> {
    const users = await this.getMatchingAdminUsers(serviceId, locationId);
    
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      serviceId: user.serviceId,
      locationId: user.locationId,
    } as User));
  }

  /**
   * Get admin users for a specific location (backward compatibility)
   */
  async getAdminUsersForLocation(locationId: number): Promise<User[]> {
    return this.getAdminUsersForServiceAndLocation(null, locationId);
  }

  /**
   * Update user assignments when user's service or location changes
   */
  async updateUserServiceLocationAssignments(
    userId: number,
    newServiceId: number | null,
    newLocationId: number | null,
    oldServiceId: number | null,
    oldLocationId: number | null
  ): Promise<void> {
    // Remove assignments from quizzes that don't match new service/location
    if (oldServiceId || oldLocationId) {
      const queryBuilder = this.userQuizAssignmentRepository
        .createQueryBuilder()
        .delete()
        .from(UserQuizAssignment)
        .where('userId = :userId', { userId })
        .andWhere('assignedBy = :assignedBy', { assignedBy: 'system' });

      // Build dynamic WHERE clause for quiz filtering
      let quizWhereConditions: string[] = [];
      const queryParams: any = {};

      if (oldServiceId && oldServiceId !== newServiceId) {
        quizWhereConditions.push('"serviceId" = :oldServiceId');
        queryParams.oldServiceId = oldServiceId;
      }

      if (oldLocationId && oldLocationId !== newLocationId) {
        quizWhereConditions.push('"locationId" = :oldLocationId');
        queryParams.oldLocationId = oldLocationId;
      }

      if (quizWhereConditions.length > 0) {
        queryBuilder.andWhere(
          `quizId IN (SELECT id FROM quizzes WHERE ${quizWhereConditions.join(' OR ')})`,
          queryParams
        );

        await queryBuilder.execute();
      }
    }

    // Auto-assign to quizzes matching new service and location
    if (newServiceId || newLocationId) {
      let quizQuery = 'SELECT id, "serviceId", "locationId" FROM quizzes WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (newServiceId) {
        quizQuery += ` AND "serviceId" = $${paramIndex}`;
        params.push(newServiceId);
        paramIndex++;
      }

      if (newLocationId) {
        quizQuery += ` AND "locationId" = $${paramIndex}`;
        params.push(newLocationId);
        paramIndex++;
      }

      const matchingQuizzes = await this.userQuizAssignmentRepository.query(quizQuery, params);

      for (const quiz of matchingQuizzes) {
        const existingAssignment = await this.userQuizAssignmentRepository.findOne({
          where: {
            userId: userId,
            quizId: quiz.id,
          },
        });

        if (!existingAssignment) {
          const assignment = this.userQuizAssignmentRepository.create({
            userId: userId,
            quizId: quiz.id,
            isActive: true,
            assignedBy: 'system',
            notes: `Auto-assigned based on service/location change (serviceId: ${newServiceId}, locationId: ${newLocationId})`,
          });

          await this.userQuizAssignmentRepository.save(assignment);
        }
      }
    }
  }

  /**
   * Update user assignments when user's location changes (backward compatibility)
   */
  async updateUserLocationAssignments(
    userId: number, 
    newLocationId: number | null, 
    oldLocationId: number | null
  ): Promise<void> {
    return this.updateUserServiceLocationAssignments(
      userId, 
      null, 
      newLocationId, 
      null, 
      oldLocationId
    );
  }

  /**
   * Check if user has access to quiz based on service and location
   */
  async checkUserQuizAccess(
    userId: number,
    quizServiceId: number | null,
    quizLocationId: number | null
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true }
    });

    if (!user) return false;

    // SuperAdmin with all_services and all_locations has access to everything
    const allServicesConfig = await this.configItemRepository.findOne({
      where: { group: 'service', key: 'all_services' }
    });
    
    const allLocationsConfig = await this.configItemRepository.findOne({
      where: { group: 'location', key: 'all_locations' }
    });

    const hasAllServices = user.serviceId === allServicesConfig?.id;
    const hasAllLocations = user.locationId === allLocationsConfig?.id;

    // SuperAdmin access
    if (hasAllServices && hasAllLocations) {
      return true;
    }

    // Service check
    const serviceMatch = !quizServiceId || 
                        user.serviceId === quizServiceId || 
                        hasAllServices;

    // Location check
    const locationMatch = !quizLocationId || 
                         user.locationId === quizLocationId || 
                         hasAllLocations;

    return serviceMatch && locationMatch;
  }
}