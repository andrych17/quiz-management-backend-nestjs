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
    serviceKey: string | null,
    locationKey: string | null, 
    createdBy?: string
  ): Promise<UserQuizAssignment[]> {
    // Find matching admin users based on service and location
    const adminUsers = await this.getMatchingAdminUsers(serviceKey, locationKey);

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
          notes: `Auto-assigned based on service/location match (serviceKey: ${serviceKey}, locationKey: ${locationKey})`,
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
    serviceKey: string | null, 
    locationKey: string | null
  ): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: 'admin' })
      .andWhere('user.isActive = :isActive', { isActive: true });

    // Service filtering logic
    if (serviceKey) {
      queryBuilder.andWhere(
        '(user.serviceKey = :serviceKey OR user.serviceKey = :allServicesKey)',
        { 
          serviceKey, 
          allServicesKey: 'all_services'
        }
      );
    } else {
      // If no serviceKey specified, only superadmin with all_services can see
      queryBuilder.andWhere('user.serviceKey = :allServicesKey', { 
        allServicesKey: 'all_services'
      });
    }

    // Location filtering logic
    if (locationKey) {
      queryBuilder.andWhere(
        '(user.locationKey = :locationKey OR user.locationKey = :allLocationsKey)',
        {
          locationKey,
          allLocationsKey: 'all_locations'
        }
      );
    } else {
      // If no locationKey specified, only superadmin with all_locations can see
      queryBuilder.andWhere('user.locationKey = :allLocationsKey', { 
        allLocationsKey: 'all_locations'
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get admin users for a specific service and location
   */
  async getAdminUsersForServiceAndLocation(
    serviceKey: string | null, 
    locationKey: string | null
  ): Promise<User[]> {
    const users = await this.getMatchingAdminUsers(serviceKey, locationKey);
    
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      serviceKey: user.serviceKey,
      locationKey: user.locationKey,
    } as User));
  }

  /**
   * Get admin users for a specific location (backward compatibility)
   */
  async getAdminUsersForLocation(locationKey: string): Promise<User[]> {
    return this.getAdminUsersForServiceAndLocation(null, locationKey);
  }

  /**
   * Update user assignments when user's service or location changes
   */
  async updateUserServiceLocationAssignments(
    userId: number,
    newServiceKey: string | null,
    newLocationKey: string | null,
    oldServiceKey: string | null,
    oldLocationKey: string | null
  ): Promise<void> {
    // Remove assignments from quizzes that don't match new service/location
    if (oldServiceKey || oldLocationKey) {
      const queryBuilder = this.userQuizAssignmentRepository
        .createQueryBuilder()
        .delete()
        .from(UserQuizAssignment)
        .where('userId = :userId', { userId })
        .andWhere('assignedBy = :assignedBy', { assignedBy: 'system' });

      // Build dynamic WHERE clause for quiz filtering
      let quizWhereConditions: string[] = [];
      const queryParams: any = {};

      if (oldServiceKey && oldServiceKey !== newServiceKey) {
        quizWhereConditions.push('"serviceKey" = :oldServiceKey');
        queryParams.oldServiceKey = oldServiceKey;
      }

      if (oldLocationKey && oldLocationKey !== newLocationKey) {
        quizWhereConditions.push('"locationKey" = :oldLocationKey');
        queryParams.oldLocationKey = oldLocationKey;
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
    if (newServiceKey || newLocationKey) {
      let quizQuery = 'SELECT id, "serviceKey", "locationKey" FROM quizzes WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (newServiceKey) {
        quizQuery += ` AND "serviceKey" = $${paramIndex}`;
        params.push(newServiceKey);
        paramIndex++;
      }

      if (newLocationKey) {
        quizQuery += ` AND "locationKey" = $${paramIndex}`;
        params.push(newLocationKey);
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
            notes: `Auto-assigned based on service/location change (serviceKey: ${newServiceKey}, locationKey: ${newLocationKey})`,
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
    newLocationKey: string | null, 
    oldLocationKey: string | null
  ): Promise<void> {
    return this.updateUserServiceLocationAssignments(
      userId, 
      null, 
      newLocationKey, 
      null, 
      oldLocationKey
    );
  }

  /**
   * Check if user has access to quiz based on service and location
   */
  async checkUserQuizAccess(
    userId: number,
    quizServiceKey: string | null,
    quizLocationKey: string | null
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true }
    });

    if (!user) return false;

    // SuperAdmin with all_services and all_locations has access to everything
    const hasAllServices = user.serviceKey === 'all_services';
    const hasAllLocations = user.locationKey === 'all_locations';

    // SuperAdmin access
    if (hasAllServices && hasAllLocations) {
      return true;
    }

    // Service check
    const serviceMatch = !quizServiceKey || 
                        user.serviceKey === quizServiceKey || 
                        hasAllServices;

    // Location check
    const locationMatch = !quizLocationKey || 
                         user.locationKey === quizLocationKey || 
                         hasAllLocations;

    return serviceMatch && locationMatch;
  }
}