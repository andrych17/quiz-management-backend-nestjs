import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserQuizSession,
  SessionStatus,
} from '../entities/user-quiz-session.entity';
import { Quiz, QuizType } from '../entities/quiz.entity';
import { User } from '../entities/user.entity';
import {
  StartQuizSessionDto,
  UpdateSessionDto,
  ResumeSessionDto,
  SessionTimeUpdateDto,
  StartSessionByQuizTokenDto,
} from '../dto/user-quiz-session.dto';
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

  async startSession(
    startQuizSessionDto: StartQuizSessionDto,
  ): Promise<UserQuizSession> {
    const { quizId, userId, userEmail, userIdentifier } = startQuizSessionDto;

    // Verify quiz exists and is active
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, isActive: true, isPublished: true },
    });

    if (!quiz) {
      throw new NotFoundException(`Active quiz with ID ${quizId} not found`);
    }

    // Quiz timing is now session-based, not quiz-level
    const now = new Date();

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

  async startSessionByQuizToken(
    startSessionDto: StartSessionByQuizTokenDto,
  ): Promise<UserQuizSession> {
    const { quizToken, userEmail, userId, userIdentifier } = startSessionDto;

    // Find quiz by token
    const quiz = await this.quizRepository.findOne({
      where: { token: quizToken, isActive: true, isPublished: true },
    });

    if (!quiz) {
      throw new NotFoundException(
        `Active quiz with token ${quizToken} not found`,
      );
    }

    // Quiz timing is now session-based, not quiz-level
    const now = new Date();

    // Check for existing active session for this user and quiz
    const existingSession = await this.sessionRepository.findOne({
      where: {
        quizId: quiz.id,
        userEmail,
        sessionStatus: SessionStatus.ACTIVE,
      },
      relations: ['quiz'],
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

    // Verify user exists (if userId provided)
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
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
      quizId: quiz.id,
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

    const savedSession = await this.sessionRepository.save(session);

    // Load quiz relation
    return await this.sessionRepository.findOne({
      where: { id: savedSession.id },
      relations: ['quiz'],
    });
  }

  async resumeSession(
    resumeSessionDto: ResumeSessionDto,
  ): Promise<UserQuizSession> {
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
        (new Date().getTime() - new Date(session.startedAt).getTime()) / 1000,
      );
      session.timeSpentSeconds = totalTime;
    }

    return await this.sessionRepository.save(session);
  }

  async updateSessionTime(
    sessionTimeUpdateDto: SessionTimeUpdateDto,
  ): Promise<UserQuizSession> {
    const { sessionToken, additionalTimeSeconds, metadata } =
      sessionTimeUpdateDto;

    const session = await this.findByToken(sessionToken);

    if (!session.isActive) {
      throw new BadRequestException('Session is not active');
    }

    // Update time spent
    session.timeSpentSeconds += additionalTimeSeconds;

    // Update remaining time if quiz has duration
    if (session.remainingSeconds !== null) {
      session.remainingSeconds = Math.max(
        0,
        session.remainingSeconds - additionalTimeSeconds,
      );
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
    // Try to find session by session token first
    const session = await this.sessionRepository.findOne({
      where: { sessionToken },
      relations: ['quiz', 'user'],
    });

    // If not found and token doesn't start with 'sess_',
    // it might be a quiz token - check if it's a quiz token
    if (!session && !sessionToken.startsWith('sess_')) {
      // Try to find quiz by this token
      const quiz = await this.quizRepository.findOne({
        where: { token: sessionToken },
      });

      if (quiz) {
        throw new NotFoundException(
          `Token "${sessionToken}" is a QUIZ token, not a session token. ` +
            `Use POST /api/quiz-sessions/start-by-token with body: {"quizToken": "${sessionToken}", "userEmail": "your@email.com"} to create a session first.`,
        );
      }

      // Not a quiz token either, provide generic help
      throw new NotFoundException(
        `Session with token ${sessionToken} not found. ` +
          `Session tokens start with "sess_". If you have a quiz token, use POST /api/quiz-sessions/start-by-token instead.`,
      );
    }

    if (!session) {
      throw new NotFoundException(
        `Session with token ${sessionToken} not found`,
      );
    }

    return session;
  }

  async findOrCreateByToken(
    token: string,
    userEmail?: string,
  ): Promise<UserQuizSession> {
    // Check if it's a session token (starts with 'sess_')
    if (token.startsWith('sess_')) {
      // Find existing session by session token
      const session = await this.sessionRepository.findOne({
        where: { sessionToken: token },
        relations: ['quiz', 'user'],
      });

      if (!session) {
        throw new NotFoundException(`Session with token ${token} not found`);
      }

      return session;
    }

    // Otherwise, treat it as a quiz token
    // Find quiz by token
    const quiz = await this.quizRepository.findOne({
      where: { token, isActive: true, isPublished: true },
    });

    if (!quiz) {
      throw new NotFoundException(
        `Quiz with token ${token} not found or not published`,
      );
    }

    // Quiz is ready to start - timing is controlled by individual sessions
    const now = new Date();

    // If userEmail not provided, try to find any active session for this quiz
    // (for guest/anonymous access)
    if (!userEmail) {
      // For anonymous access, create a guest session with placeholder email
      const guestEmail = `guest_${Date.now()}@quiz.temp`;
      return await this.createSessionForQuiz(quiz, guestEmail, null, null);
    }

    // Check for existing active session for this user and quiz
    const existingSession = await this.sessionRepository.findOne({
      where: {
        quizId: quiz.id,
        userEmail,
        sessionStatus: SessionStatus.ACTIVE,
      },
      relations: ['quiz', 'user'],
    });

    if (existingSession && !existingSession.isExpired) {
      return existingSession;
    }

    // Create new session
    return await this.createSessionForQuiz(quiz, userEmail, null, null);
  }

  private async createSessionForQuiz(
    quiz: any,
    userEmail: string,
    userId: number | null,
    userIdentifier: string | null,
  ): Promise<UserQuizSession> {
    const now = new Date();

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
      quizId: quiz.id,
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

    const savedSession = await this.sessionRepository.save(session);

    // Load quiz relation
    return await this.sessionRepository.findOne({
      where: { id: savedSession.id },
      relations: ['quiz', 'user'],
    });
  }

  async findByUserAndQuiz(
    userId: number,
    quizId: number,
  ): Promise<UserQuizSession | null> {
    return await this.sessionRepository.findOne({
      where: { userId, quizId },
      relations: ['quiz', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmailAndQuiz(
    userEmail: string,
    quizId: number,
  ): Promise<UserQuizSession | null> {
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
      activeSessions: sessions.filter(
        (s) => s.sessionStatus === SessionStatus.ACTIVE,
      ).length,
      completedSessions: sessions.filter(
        (s) => s.sessionStatus === SessionStatus.COMPLETED,
      ).length,
      expiredSessions: sessions.filter(
        (s) => s.sessionStatus === SessionStatus.EXPIRED,
      ).length,
      averageTimeSpent: 0,
    };

    if (sessions.length > 0) {
      const totalTime = sessions.reduce(
        (sum, s) => sum + (s.timeSpentSeconds || 0),
        0,
      );
      stats.averageTimeSpent = Math.round(totalTime / sessions.length);
    }

    return stats;
  }
}
