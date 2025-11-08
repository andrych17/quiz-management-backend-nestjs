import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserQuizSession, SessionStatus } from '../entities/user-quiz-session.entity';
import { Quiz } from '../entities/quiz.entity';
import { User } from '../entities/user.entity';
import { StartQuizSessionDto, UpdateSessionDto, ResumeSessionDto, SessionTimeUpdateDto } from '../dto/user-quiz-session.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserQuizSessionService {
  constructor(
    @InjectRepository(UserQuizSession)
    private sessionRepository: Repository<UserQuizSession>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async startSession(startQuizSessionDto: StartQuizSessionDto): Promise<UserQuizSession> {
    const { quizId, userId, userEmail, userIdentifier } = startQuizSessionDto;

    // Verify quiz exists and is active
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, isActive: true, isPublished: true },
    });

    if (!quiz) {
      throw new NotFoundException(`Active quiz with ID ${quizId} not found`);
    }

    // Check if quiz is within time window
    const now = new Date();
    if (quiz.startDateTime && now < quiz.startDateTime) {
      throw new BadRequestException('Quiz has not started yet');
    }
    if (quiz.endDateTime && now > quiz.endDateTime) {
      throw new BadRequestException('Quiz has ended');
    }

    // Verify user exists (if userId provided)
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
    }

    // Check for existing active session for this user and quiz
    const existingSession = await this.sessionRepository.findOne({
      where: {
        quizId,
        userEmail,
        sessionStatus: SessionStatus.ACTIVE,
      },
    });

    if (existingSession) {
      // Return existing session if still valid
      if (!existingSession.isExpired) {
        return existingSession;
      } else {
        // Mark expired session as expired
        await this.expireSession(existingSession.id);
      }
    }

    // Calculate expiration time based on quiz duration
    let expiresAt: Date | null = null;
    let remainingSeconds: number | null = null;

    if (quiz.durationMinutes) {
      expiresAt = new Date(now.getTime() + quiz.durationMinutes * 60 * 1000);
      remainingSeconds = quiz.durationMinutes * 60;
    }

    // Create new session
    const session = this.sessionRepository.create({
      userId: userId || null,
      quizId,
      sessionToken: `sess_${uuidv4().replace(/-/g, '')}`,
      sessionStatus: SessionStatus.ACTIVE,
      startedAt: now,
      expiresAt,
      remainingSeconds,
      userEmail,
      userIdentifier,
      timeSpentSeconds: 0,
      metadata: {},
    });

    return await this.sessionRepository.save(session);
  }

  async resumeSession(resumeSessionDto: ResumeSessionDto): Promise<UserQuizSession> {
    const { sessionToken, userEmail } = resumeSessionDto;

    const session = await this.sessionRepository.findOne({
      where: { sessionToken, userEmail },
      relations: ['quiz'],
    });

    if (!session) {
      throw new NotFoundException('Session not found or invalid credentials');
    }

    if (session.isExpired) {
      await this.expireSession(session.id);
      throw new BadRequestException('Session has expired');
    }

    if (session.sessionStatus === SessionStatus.COMPLETED) {
      throw new BadRequestException('Quiz session is already completed');
    }

    // Resume session if paused
    if (session.sessionStatus === SessionStatus.PAUSED) {
      session.sessionStatus = SessionStatus.ACTIVE;
      session.resumedAt = new Date();
      await this.sessionRepository.save(session);
    }

    return session;
  }

  async pauseSession(sessionToken: string): Promise<UserQuizSession> {
    const session = await this.findByToken(sessionToken);

    if (session.sessionStatus !== SessionStatus.ACTIVE) {
      throw new BadRequestException('Can only pause active sessions');
    }

    if (session.isExpired) {
      await this.expireSession(session.id);
      throw new BadRequestException('Session has expired');
    }

    session.sessionStatus = SessionStatus.PAUSED;
    session.pausedAt = new Date();

    return await this.sessionRepository.save(session);
  }

  async completeSession(sessionToken: string): Promise<UserQuizSession> {
    const session = await this.findByToken(sessionToken);

    if (session.sessionStatus === SessionStatus.COMPLETED) {
      return session; // Already completed
    }

    session.sessionStatus = SessionStatus.COMPLETED;
    session.completedAt = new Date();

    // Calculate final time spent
    if (session.startedAt) {
      const totalTime = Math.floor(
        (new Date().getTime() - new Date(session.startedAt).getTime()) / 1000
      );
      session.timeSpentSeconds = totalTime;
    }

    return await this.sessionRepository.save(session);
  }

  async updateSessionTime(sessionTimeUpdateDto: SessionTimeUpdateDto): Promise<UserQuizSession> {
    const { sessionToken, additionalTimeSeconds, metadata } = sessionTimeUpdateDto;

    const session = await this.findByToken(sessionToken);

    if (!session.isActive) {
      throw new BadRequestException('Session is not active');
    }

    // Update time spent
    session.timeSpentSeconds += additionalTimeSeconds;

    // Update remaining time if quiz has duration
    if (session.remainingSeconds !== null) {
      session.remainingSeconds = Math.max(0, session.remainingSeconds - additionalTimeSeconds);
    }

    // Update metadata
    if (metadata) {
      session.metadata = { ...session.metadata, ...metadata };
    }

    // Check if time is up
    if (session.remainingSeconds !== null && session.remainingSeconds <= 0) {
      session.sessionStatus = SessionStatus.EXPIRED;
      session.expiresAt = new Date();
    }

    return await this.sessionRepository.save(session);
  }

  async findByToken(sessionToken: string): Promise<UserQuizSession> {
    const session = await this.sessionRepository.findOne({
      where: { sessionToken },
      relations: ['quiz', 'user'],
    });

    if (!session) {
      throw new NotFoundException(`Session with token ${sessionToken} not found`);
    }

    return session;
  }

  async findByUserAndQuiz(userId: number, quizId: number): Promise<UserQuizSession | null> {
    return await this.sessionRepository.findOne({
      where: { userId, quizId },
      relations: ['quiz', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmailAndQuiz(userEmail: string, quizId: number): Promise<UserQuizSession | null> {
    return await this.sessionRepository.findOne({
      where: { userEmail, quizId },
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveSessions(): Promise<UserQuizSession[]> {
    return await this.sessionRepository.find({
      where: { sessionStatus: SessionStatus.ACTIVE },
      relations: ['quiz', 'user'],
      order: { startedAt: 'DESC' },
    });
  }

  async getSessionsByQuiz(quizId: number): Promise<UserQuizSession[]> {
    return await this.sessionRepository.find({
      where: { quizId },
      relations: ['quiz', 'user'],
      order: { startedAt: 'DESC' },
    });
  }

  async expireSession(sessionId: number): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      sessionStatus: SessionStatus.EXPIRED,
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    
    // Find all sessions that should be expired
    const expiredSessions = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.expiresAt IS NOT NULL')
      .andWhere('session.expiresAt < :now', { now })
      .andWhere('session.sessionStatus != :expired', { expired: SessionStatus.EXPIRED })
      .getMany();

    if (expiredSessions.length === 0) {
      return 0;
    }

    // Update them to expired status
    await this.sessionRepository
      .createQueryBuilder()
      .update(UserQuizSession)
      .set({ sessionStatus: SessionStatus.EXPIRED })
      .where('id IN (:...ids)', { ids: expiredSessions.map(s => s.id) })
      .execute();

    return expiredSessions.length;
  }

  async getSessionStatistics(quizId: number): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    expiredSessions: number;
    averageTimeSpent: number;
  }> {
    const sessions = await this.sessionRepository.find({
      where: { quizId },
    });

    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.sessionStatus === SessionStatus.ACTIVE).length,
      completedSessions: sessions.filter(s => s.sessionStatus === SessionStatus.COMPLETED).length,
      expiredSessions: sessions.filter(s => s.sessionStatus === SessionStatus.EXPIRED).length,
      averageTimeSpent: 0,
    };

    if (sessions.length > 0) {
      const totalTime = sessions.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);
      stats.averageTimeSpent = Math.round(totalTime / sessions.length);
    }

    return stats;
  }
}