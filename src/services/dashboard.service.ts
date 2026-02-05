import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { User } from '../entities/user.entity';
import { Attempt } from '../entities/attempt.entity';
import { DebugLogger } from '../lib/debug-logger';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Attempt)
    private attemptRepository: Repository<Attempt>,
  ) {}

  /**
   * Get count of active and published quizzes
   */
  async getActiveQuizzesCount(userId?: number, userRole?: string): Promise<number> {
    DebugLogger.service('DashboardService', 'getActiveQuizzesCount', { userId, userRole });
    
    const user = userId ? await this.userRepository.findOne({ where: { id: userId } }) : null;
    
    const queryBuilder = this.quizRepository
      .createQueryBuilder('quiz')
      .where('quiz.isActive = :isActive', { isActive: true })
      .andWhere('quiz.isPublished = :isPublished', { isPublished: true });
    
    // Apply filtering for admin (not superadmin)
    if (userRole === 'admin' && user) {
      if (
        user.serviceKey &&
        user.serviceKey !== 'all_services' &&
        !user.serviceKey.startsWith('all_')
      ) {
        queryBuilder.andWhere(
          '(quiz.serviceKey = :userServiceKey OR quiz.serviceKey = :allServicesKey OR quiz.serviceKey LIKE :allServicesPattern)',
          {
            userServiceKey: user.serviceKey,
            allServicesKey: 'all_services',
            allServicesPattern: 'all_%',
          },
        );
      }
      
      if (
        user.locationKey &&
        user.locationKey !== 'all_locations' &&
        !user.locationKey.startsWith('all_')
      ) {
        queryBuilder.andWhere(
          '(quiz.locationKey = :userLocationKey OR quiz.locationKey = :allLocationsKey OR quiz.locationKey LIKE :allLocationsPattern)',
          {
            userLocationKey: user.locationKey,
            allLocationsKey: 'all_locations',
            allLocationsPattern: 'all_%',
          },
        );
      }
    }
    
    const count = await queryBuilder.getCount();
    DebugLogger.debug('DashboardService', `Active quizzes count: ${count}`);
    return count;
  }

  /**
   * Get count of admin users (admin + superadmin)
   */
  async getAdminUsersCount(): Promise<number> {
    DebugLogger.service('DashboardService', 'getAdminUsersCount', {});
    const admins = await this.userRepository.count({
      where: [{ role: 'admin' }, { role: 'superadmin' }],
    });
    DebugLogger.debug('DashboardService', `Admin users count: ${admins}`);
    return admins;
  }

  /**
   * Get quizzes that have attempts started today
   */
  async getTodayActiveQuizzes(userId?: number, userRole?: string) {
    DebugLogger.service('DashboardService', 'getTodayActiveQuizzes', { userId, userRole });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    DebugLogger.debug(
      'DashboardService',
      `Fetching attempts from ${today.toISOString()} to ${tomorrow.toISOString()}`,
    );

    const user = userId ? await this.userRepository.findOne({ where: { id: userId } }) : null;
    
    const queryBuilder = this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoinAndSelect('attempt.quiz', 'quiz')
      .where('attempt.startedAt >= :today', { today })
      .andWhere('attempt.startedAt < :tomorrow', { tomorrow });
    
    // Apply filtering for admin (not superadmin)
    if (userRole === 'admin' && user) {
      if (
        user.serviceKey &&
        user.serviceKey !== 'all_services' &&
        !user.serviceKey.startsWith('all_')
      ) {
        queryBuilder.andWhere(
          '(quiz.serviceKey = :userServiceKey OR quiz.serviceKey = :allServicesKey OR quiz.serviceKey LIKE :allServicesPattern)',
          {
            userServiceKey: user.serviceKey,
            allServicesKey: 'all_services',
            allServicesPattern: 'all_%',
          },
        );
      }
      
      if (
        user.locationKey &&
        user.locationKey !== 'all_locations' &&
        !user.locationKey.startsWith('all_')
      ) {
        queryBuilder.andWhere(
          '(quiz.locationKey = :userLocationKey OR quiz.locationKey = :allLocationsKey OR quiz.locationKey LIKE :allLocationsPattern)',
          {
            userLocationKey: user.locationKey,
            allLocationsKey: 'all_locations',
            allLocationsPattern: 'all_%',
          },
        );
      }
    }
    
    const attemptsToday = await queryBuilder.getMany();

    DebugLogger.debug(
      'DashboardService',
      `Found ${attemptsToday.length} attempts today`,
    );

    // Group by quiz and count attempts
    const quizMap = new Map<number, { quiz: Quiz; attemptCount: number }>();

    attemptsToday.forEach((attempt) => {
      if (attempt.quiz) {
        const existing = quizMap.get(attempt.quiz.id);
        if (existing) {
          existing.attemptCount++;
        } else {
          quizMap.set(attempt.quiz.id, {
            quiz: attempt.quiz,
            attemptCount: 1,
          });
        }
      }
    });

    const result = Array.from(quizMap.values()).map((item) => ({
      id: item.quiz.id,
      title: item.quiz.title,
      attemptCount: item.attemptCount,
    }));

    DebugLogger.debug(
      'DashboardService',
      `Today's active quizzes: ${result.length}`,
      result,
    );
    return result;
  }

  /**
   * Get count of unique participants (by email) who started attempts today
   */
  async getTodayParticipantsCount(userId?: number, userRole?: string): Promise<number> {
    DebugLogger.service('DashboardService', 'getTodayParticipantsCount', { userId, userRole });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const user = userId ? await this.userRepository.findOne({ where: { id: userId } }) : null;
    
    const queryBuilder = this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('attempt.quiz', 'quiz')
      .select('attempt.email')
      .where('attempt.startedAt >= :today', { today })
      .andWhere('attempt.startedAt < :tomorrow', { tomorrow });
    
    // Apply filtering for admin (not superadmin)
    if (userRole === 'admin' && user) {
      if (
        user.serviceKey &&
        user.serviceKey !== 'all_services' &&
        !user.serviceKey.startsWith('all_')
      ) {
        queryBuilder.andWhere(
          '(quiz.serviceKey = :userServiceKey OR quiz.serviceKey = :allServicesKey OR quiz.serviceKey LIKE :allServicesPattern)',
          {
            userServiceKey: user.serviceKey,
            allServicesKey: 'all_services',
            allServicesPattern: 'all_%',
          },
        );
      }
      
      if (
        user.locationKey &&
        user.locationKey !== 'all_locations' &&
        !user.locationKey.startsWith('all_')
      ) {
        queryBuilder.andWhere(
          '(quiz.locationKey = :userLocationKey OR quiz.locationKey = :allLocationsKey OR quiz.locationKey LIKE :allLocationsPattern)',
          {
            userLocationKey: user.locationKey,
            allLocationsKey: 'all_locations',
            allLocationsPattern: 'all_%',
          },
        );
      }
    }
    
    const attemptsToday = await queryBuilder.getMany();

    // Get unique emails
    const uniqueEmails = new Set(attemptsToday.map((a) => a.email));
    DebugLogger.debug(
      'DashboardService',
      `Today's unique participants: ${uniqueEmails.size}`,
    );
    return uniqueEmails.size;
  }

  /**
   * Get recent activity (recent attempts)
   */
  async getRecentActivity(limit: number = 50, userId?: number, userRole?: string) {
    DebugLogger.service('DashboardService', 'getRecentActivity', { limit, userId, userRole });
    
    // Get user info for filtering (if not superadmin)
    const user = userId ? await this.userRepository.findOne({ where: { id: userId } }) : null;
    
    const queryBuilder = this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoinAndSelect('attempt.quiz', 'quiz')
      .orderBy('attempt.startedAt', 'DESC')
      .take(limit);
    
    // Apply filtering for admin (not superadmin)
    if (userRole === 'admin' && user) {
      // Filter by service - quiz must match user's service OR have "all_services"
      if (
        user.serviceKey &&
        user.serviceKey !== 'all_services' &&
        !user.serviceKey.startsWith('all_')
      ) {
        queryBuilder.andWhere(
          '(quiz.serviceKey = :userServiceKey OR quiz.serviceKey = :allServicesKey OR quiz.serviceKey LIKE :allServicesPattern)',
          {
            userServiceKey: user.serviceKey,
            allServicesKey: 'all_services',
            allServicesPattern: 'all_%',
          },
        );
      }
      
      // Filter by location - quiz must match user's location OR have "all_locations"
      if (
        user.locationKey &&
        user.locationKey !== 'all_locations' &&
        !user.locationKey.startsWith('all_')
      ) {
        queryBuilder.andWhere(
          '(quiz.locationKey = :userLocationKey OR quiz.locationKey = :allLocationsKey OR quiz.locationKey LIKE :allLocationsPattern)',
          {
            userLocationKey: user.locationKey,
            allLocationsKey: 'all_locations',
            allLocationsPattern: 'all_%',
          },
        );
      }
    }
    
    const recentAttempts = await queryBuilder.getMany();

    DebugLogger.debug(
      'DashboardService',
      `Found ${recentAttempts.length} recent attempts`,
    );

    const result = recentAttempts.map((attempt) => {
      const submissionStatus = attempt.submittedAt ? 'submitted' : 'not_submitted';
      const passStatus = attempt.submittedAt 
        ? (attempt.passed ? 'passed' : 'failed')
        : null;

      return {
        id: attempt.id,
        participantName: attempt.participantName,
        email: attempt.email,
        nij: attempt.nij,
        quizId: attempt.quizId,
        quizTitle: attempt.quiz?.title || 'Unknown Quiz',
        score: attempt.score,
        passed: attempt.passed,
        submissionStatus: submissionStatus,
        passStatus: passStatus,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      };
    });

    return result;
  }

  /**
   * Get all dashboard statistics in one call
   */
  async getDashboardStats(userId?: number, userRole?: string) {
    DebugLogger.service('DashboardService', 'getDashboardStats', { userId, userRole });
    const [activeQuizzes, adminUsers, todayActiveQuizzes, todayParticipants] =
      await Promise.all([
        this.getActiveQuizzesCount(userId, userRole),
        this.getAdminUsersCount(),
        this.getTodayActiveQuizzes(userId, userRole),
        this.getTodayParticipantsCount(userId, userRole),
      ]);

    const stats = {
      activeQuizzes,
      adminUsers,
      todayActiveQuizzes,
      todayParticipants,
    };

    DebugLogger.success(
      'DashboardService',
      'Dashboard stats retrieved successfully',
      stats,
    );
    return stats;
  }
}
