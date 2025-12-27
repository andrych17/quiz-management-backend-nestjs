import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, ConfigItem, Quiz, Question, QuizScoring } from '../entities';
import { QuizType } from '../entities/quiz.entity';

export class ComprehensiveSeeder {
  constructor(private dataSource: DataSource) { }

  async run(): Promise<void> {
    console.log('🌱 Starting comprehensive database seeding...');

    await this.seedConfigItems();
    await this.seedUsers();
    await this.seedQuizzes();

    console.log('✅ Comprehensive database seeding completed!');
  }

  private async seedConfigItems(): Promise<void> {
    const configRepository = this.dataSource.getRepository(ConfigItem);

    const configs = [
      // ==================== LOCATIONS ====================
      {
        group: 'locations',
        key: 'all_locations',
        value: 'All Locations',
        description: 'Access to all locations (for superadmin)',
        order: 0,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'locations',
        key: 'jakarta',
        value: 'Jakarta',
        description: 'DKI Jakarta',
        order: 1,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'locations',
        key: 'surabaya',
        value: 'Surabaya',
        description: 'Jawa Timur - Surabaya',
        order: 2,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'locations',
        key: 'bandung',
        value: 'Bandung',
        description: 'Jawa Barat - Bandung',
        order: 3,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'locations',
        key: 'medan',
        value: 'Medan',
        description: 'Sumatera Utara - Medan',
        order: 4,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'locations',
        key: 'semarang',
        value: 'Semarang',
        description: 'Jawa Tengah - Semarang',
        order: 5,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'locations',
        key: 'makassar',
        value: 'Makassar',
        description: 'Sulawesi Selatan - Makassar',
        order: 6,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'locations',
        key: 'denpasar',
        value: 'Denpasar',
        description: 'Bali - Denpasar',
        order: 7,
        isActive: true,
        createdBy: 'system',
      },

      // ==================== SERVICES ====================
      {
        group: 'services',
        key: 'all_services',
        value: 'All Services',
        description: 'Access to all services (for superadmin)',
        order: 0,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'services',
        key: 'sm',
        value: 'Service Ministry',
        description: 'Service Ministry - pelayanan jemaat',
        order: 1,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'services',
        key: 'am',
        value: 'Art Ministry',
        description: 'Art Ministry - pelayanan seni dan musik',
        order: 2,
        isActive: true,
        createdBy: 'system',
      },
    ];

    await configRepository.save(configs);
    console.log(`✓ Seeded ${configs.length} config items`);
  }

  private async seedUsers(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);

    // Hash passwords
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);

    const users = [
      // ==================== SUPERADMIN ====================
      {
        email: 'superadmin@gms.com',
        name: 'Super Administrator',
        password: defaultPassword,
        role: 'superadmin' as const,
        serviceKey: 'all_services',
        locationKey: 'all_locations',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      },

      // ==================== SERVICE MANAGEMENT ====================
      {
        email: 'admin.sm.jakarta@gms.com',
        name: 'Admin SM Jakarta',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'sm',
        locationKey: 'jakarta',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'admin.sm.surabaya@gms.com',
        name: 'Admin SM Surabaya',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'sm',
        locationKey: 'surabaya',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'admin.sm.bandung@gms.com',
        name: 'Admin SM Bandung',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'sm',
        locationKey: 'bandung',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },

      // ==================== ASSET MANAGEMENT ====================
      {
        email: 'admin.am.jakarta@gms.com',
        name: 'Admin AM Jakarta',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'am',
        locationKey: 'jakarta',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'admin.am.surabaya@gms.com',
        name: 'Admin AM Surabaya',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'am',
        locationKey: 'surabaya',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'admin.am.medan@gms.com',
        name: 'Admin AM Medan',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'am',
        locationKey: 'medan',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },

      // ==================== REGULAR USERS ====================
      {
        email: 'user.jakarta@gms.com',
        name: 'Ahmad Rizki (Jakarta)',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'jakarta',
        isActive: true,
        createdBy: 'admin.sm.jakarta@gms.com',
        updatedBy: 'admin.sm.jakarta@gms.com',
      },
      {
        email: 'user.surabaya@gms.com',
        name: 'Dewi Lestari (Surabaya)',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'surabaya',
        isActive: true,
        createdBy: 'admin.am.surabaya@gms.com',
        updatedBy: 'admin.am.surabaya@gms.com',
      },
      {
        email: 'user.bandung@gms.com',
        name: 'Rudi Hermawan (Bandung)',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'bandung',
        isActive: true,
        createdBy: 'admin.sm.bandung@gms.com',
        updatedBy: 'admin.sm.bandung@gms.com',
      },
      {
        email: 'user.medan@gms.com',
        name: 'Siti Nurhaliza (Medan)',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'medan',
        isActive: true,
        createdBy: 'admin.am.medan@gms.com',
        updatedBy: 'admin.am.medan@gms.com',
      },
      {
        email: 'user.semarang@gms.com',
        name: 'Budi Santoso (Semarang)',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'semarang',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'user.makassar@gms.com',
        name: 'Andi Mappanyukki (Makassar)',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'makassar',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'user.denpasar@gms.com',
        name: 'Ketut Widia (Denpasar)',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'denpasar',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
    ];

    await userRepository.save(users);
    console.log(`✓ Seeded ${users.length} users with hashed passwords`);
  }

  private async seedQuizzes(): Promise<void> {
    const quizRepository = this.dataSource.getRepository(Quiz);
    const questionRepository = this.dataSource.getRepository(Question);
    const scoringRepository = this.dataSource.getRepository(QuizScoring);

    // Create a sample quiz
    const quiz = await quizRepository.save({
      title: 'General Knowledge Quiz - Service Management',
      description: 'Test your knowledge about basic service management concepts and procedures',
      slug: 'general-knowledge-sm',
      token: 'GK-SM-' + Date.now(),
      serviceType: 'service_management',
      quizType: QuizType.SCHEDULED,
      locationKey: 'jakarta',
      serviceKey: 'sm',
      passingScore: 70,
      questionsPerPage: 5,
      durationMinutes: 30,
      isActive: true,
      isPublished: true,
      startDateTime: new Date('2025-01-01T08:00:00'),
      endDateTime: new Date('2025-12-31T17:00:00'),
      createdBy: 'superadmin@gms.com',
      updatedBy: 'superadmin@gms.com',
    });

    // Create questions for the quiz
    const questions = [
      {
        quizId: quiz.id,
        questionText: 'What does SLA stand for in service management?',
        questionType: 'multiple-choice' as const,
        options: [
          'Service Level Agreement',
          'System Level Analysis',
          'Standard Level Assessment',
          'Service Line Authorization',
        ],
        correctAnswer: 'Service Level Agreement',
        order: 1,
      },
      {
        quizId: quiz.id,
        questionText: 'Is ITIL a framework for IT service management?',
        questionType: 'true-false' as const,
        options: ['True', 'False'],
        correctAnswer: 'True',
        order: 2,
      },
      {
        quizId: quiz.id,
        questionText: 'Which of the following are key components of incident management? (Select all that apply)',
        questionType: 'multiple-select' as const,
        options: [
          'Incident logging',
          'Incident categorization',
          'Incident prioritization',
          'Incident celebration',
        ],
        correctAnswer: 'Incident logging,Incident categorization,Incident prioritization',
        order: 3,
      },
      {
        quizId: quiz.id,
        questionText: 'What is the main goal of change management?',
        questionType: 'multiple-choice' as const,
        options: [
          'To prevent all changes',
          'To manage changes with minimal disruption',
          'To delay all changes',
          'To automate all processes',
        ],
        correctAnswer: 'To manage changes with minimal disruption',
        order: 4,
      },
      {
        quizId: quiz.id,
        questionText: 'The primary purpose of a service desk is to provide a single point of contact between service provider and users.',
        questionType: 'true-false' as const,
        options: ['True', 'False'],
        correctAnswer: 'True',
        order: 5,
      },
    ];

    await questionRepository.save(questions);

    // Create scoring template for the quiz
    const scoring = {
      quizId: quiz.id,
      correctAnswers: 0,
      points: 20, // Each correct answer = 20 points (5 questions × 20 = 100 points max)
      isActive: true,
      createdBy: 'superadmin@gms.com',
      updatedBy: 'superadmin@gms.com',
    };

    await scoringRepository.save(scoring);

    console.log(`✓ Seeded 1 quiz with ${questions.length} questions and scoring template`);
  }
}
