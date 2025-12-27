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
  async getActiveQuizzesCount(): Promise<number> {
    DebugLogger.service('DashboardService', 'getActiveQuizzesCount', {});
    const count = await this.quizRepository.count({
      where: {
        isActive: true,
        isPublished: true,
      },
    });
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
  async getTodayActiveQuizzes() {
    DebugLogger.service('DashboardService', 'getTodayActiveQuizzes', {});
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    DebugLogger.debug('DashboardService', `Fetching attempts from ${today.toISOString()} to ${tomorrow.toISOString()}`);

    // Get attempts started today
    const attemptsToday = await this.attemptRepository.find({
      where: {
        startedAt: Between(today, tomorrow),
      },
      relations: ['quiz'],
    });

    DebugLogger.debug('DashboardService', `Found ${attemptsToday.length} attempts today`);

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

    DebugLogger.debug('DashboardService', `Today's active quizzes: ${result.length}`, result);
    return result;
  }

  /**
   * Get count of unique participants (by email) who started attempts today
   */
  async getTodayParticipantsCount(): Promise<number> {
    DebugLogger.service('DashboardService', 'getTodayParticipantsCount', {});
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attemptsToday = await this.attemptRepository.find({
      where: {
        startedAt: Between(today, tomorrow),
      },
      select: ['email'],
    });

    // Get unique emails
    const uniqueEmails = new Set(attemptsToday.map((a) => a.email));
    DebugLogger.debug('DashboardService', `Today's unique participants: ${uniqueEmails.size}`);
    return uniqueEmails.size;
  }

  /**
   * Get recent activity (recent attempts)
   */
  async getRecentActivity(limit: number = 50) {
    DebugLogger.service('DashboardService', 'getRecentActivity', { limit });
    const recentAttempts = await this.attemptRepository.find({
      relations: ['quiz'],
      order: { startedAt: 'DESC' },
      take: limit,
    });

    DebugLogger.debug('DashboardService', `Found ${recentAttempts.length} recent attempts`);

    const result = recentAttempts.map((attempt) => ({
      id: attempt.id,
      participantName: attempt.participantName,
      email: attempt.email,
      nij: attempt.nij,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz?.title || 'Unknown Quiz',
      score: attempt.score,
      passed: attempt.passed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      submittedAt: attempt.submittedAt,
    }));

    return result;
  }

  /**
   * Get all dashboard statistics in one call
   */
  async getDashboardStats() {
    DebugLogger.service('DashboardService', 'getDashboardStats', {});
    const [
      activeQuizzes,
      adminUsers,
      todayActiveQuizzes,
      todayParticipants,
    ] = await Promise.all([
      this.getActiveQuizzesCount(),
      this.getAdminUsersCount(),
      this.getTodayActiveQuizzes(),
      this.getTodayParticipantsCount(),
    ]);

    const stats = {
      activeQuizzes,
      adminUsers,
      todayActiveQuizzes,
      todayParticipants,
    };

    DebugLogger.success('DashboardService', 'Dashboard stats retrieved successfully', stats);
    return stats;
  }
}
