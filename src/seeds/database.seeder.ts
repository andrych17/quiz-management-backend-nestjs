import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Quiz, Question, Attempt, AttemptAnswer, ConfigItem, UserLocation, QuizImage } from '../entities';
import { ServiceType } from '../dto/quiz.dto';

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('Starting database seeding...');

    await this.seedUsers();
    await this.seedConfigItems();
    await this.seedQuizzes();
    await this.seedAttempts();
    await this.seedUserLocations();

    console.log('Database seeding completed!');
  }

  private async seedUsers(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);
    
    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log(`✓ Users already exist (${existingUsers} users), skipping seeding`);
      return;
    }
    
    // Hash passwords
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);
    
    const users = [
      {
        email: 'superadmin@gms.com',
        name: 'Super Admin GMS',
        password: defaultPassword,
        role: 'admin' as const,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2025-08-15T10:30:00Z'),
        createdBy: 'system',
        updatedBy: 'superadmin@gms.com',
        lastLogin: new Date('2025-08-31T10:30:00Z'),
        isActive: true,
      },
      {
        email: 'admin@gms.com',
        name: 'Admin GMS',
        password: defaultPassword,
        role: 'admin' as const,
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2025-08-16T11:00:00Z'),
        createdBy: 'superadmin@gms.com',
        updatedBy: 'admin@gms.com',
        lastLogin: new Date('2025-08-30T15:45:00Z'),
        isActive: true,
      },
      {
        email: 'user@gms.com',
        name: 'Regular User GMS',
        password: defaultPassword,
        role: 'user' as const,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        updatedAt: new Date('2025-07-20T09:15:00Z'),
        createdBy: 'superadmin@gms.com',
        updatedBy: 'user@gms.com',
        lastLogin: new Date('2025-08-29T08:30:00Z'),
        isActive: true,
      },
    ];

    await userRepository.save(users);
    console.log(`✓ Seeded ${users.length} users with hashed passwords`);
  }

  private async seedConfigItems(): Promise<void> {
    const configRepository = this.dataSource.getRepository(ConfigItem);
    
    // Check if config items already exist
    const existingConfigs = await configRepository.count();
    if (existingConfigs > 0) {
      console.log(`✓ Config items already exist (${existingConfigs} items), skipping seeding`);
      return;
    }
    
    const configs = [
      {
        group: 'app',
        key: 'name',
        value: 'Logic Test GMS Church',
        description: 'Application name',
        order: 1,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'app',
        key: 'version',
        value: '1.0.0',
        description: 'Application version',
        order: 2,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'quiz',
        key: 'default_passing_score',
        value: '70',
        description: 'Default passing score percentage',
        order: 1,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'quiz',
        key: 'default_questions_per_page',
        value: '5',
        description: 'Default number of questions per page',
        order: 2,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      // Location config items
      {
        group: 'location',
        key: 'jakarta_pusat',
        value: 'Jakarta Pusat',
        description: 'Jakarta Central location',
        order: 1,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'location',
        key: 'jakarta_utara',
        value: 'Jakarta Utara',
        description: 'Jakarta North location',
        order: 2,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'location',
        key: 'jakarta_selatan',
        value: 'Jakarta Selatan',
        description: 'Jakarta South location',
        order: 3,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'location',
        key: 'jakarta_barat',
        value: 'Jakarta Barat',
        description: 'Jakarta West location',
        order: 4,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'location',
        key: 'jakarta_timur',
        value: 'Jakarta Timur',
        description: 'Jakarta East location',
        order: 5,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ];

    await configRepository.save(configs);
    console.log(`✓ Seeded ${configs.length} config items`);
  }

  private async seedUserLocations(): Promise<void> {
    const userLocationRepository = this.dataSource.getRepository(UserLocation);
    const userRepository = this.dataSource.getRepository(User);
    const configRepository = this.dataSource.getRepository(ConfigItem);
    
    // Check if user locations already exist
    const existingUserLocations = await userLocationRepository.count();
    if (existingUserLocations > 0) {
      console.log(`✓ User locations already exist (${existingUserLocations} locations), skipping seeding`);
      return;
    }
    
    // Get users and locations
    const users = await userRepository.find();
    const locations = await configRepository.find({ where: { group: 'location' } });
    
    if (users.length === 0 || locations.length === 0) {
      console.log('❌ Users or locations not found for seeding user locations');
      return;
    }

    const userLocations = [
      {
        userId: users[0].id, // superadmin@gms.com
        locationId: locations.find(l => l.key === 'jakarta_pusat')?.id || locations[0].id,
        isActive: true,
        createdBy: 'system',
      },
      {
        userId: users[1].id, // admin@gms.com
        locationId: locations.find(l => l.key === 'jakarta_utara')?.id || locations[1].id,
        isActive: true,
        createdBy: 'system',
      },
      {
        userId: users[2].id, // user@gms.com
        locationId: locations.find(l => l.key === 'jakarta_selatan')?.id || locations[2].id,
        isActive: true,
        createdBy: 'system',
      },
    ];

    await userLocationRepository.save(userLocations);
    console.log(`✓ Seeded ${userLocations.length} user locations`);
  }

  private async seedQuizzes(): Promise<void> {
    const quizRepository = this.dataSource.getRepository(Quiz);
    const questionRepository = this.dataSource.getRepository(Question);
    const configRepository = this.dataSource.getRepository(ConfigItem);
    
    // Check if quizzes already exist
    const existingQuizzes = await quizRepository.count();
    if (existingQuizzes > 0) {
      console.log(`✓ Quizzes already exist (${existingQuizzes} quizzes), skipping seeding`);
      return;
    }
    
    // Get locations
    const locations = await configRepository.find({ where: { group: 'location' } });
    const jakartaPusat = locations.find(l => l.key === 'jakarta_pusat');
    const jakartaUtara = locations.find(l => l.key === 'jakarta_utara');
    
    // Quiz 1: Service Management
    const smQuiz = quizRepository.create({
      title: 'Test Masuk Service Management Batch 1',
      description: 'Test untuk seleksi masuk tim Service Management batch 1. Test ini mencakup pemahaman ITIL, service desk, dan manajemen layanan IT.',
      slug: 'test-sm-batch-1',
      token: 'sm-batch-1-2024',
      serviceType: ServiceType.SERVICE_MANAGEMENT,
      locationId: jakartaPusat?.id,
      isPublished: true,
      expiresAt: new Date('2025-08-30T23:59:59'),
      passingScore: 70,
      questionsPerPage: 5,
      createdBy: 'admin@gms.com',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    });

    // Quiz 2: Network Management
    const netQuiz = quizRepository.create({
      title: 'Test Network Management Batch 2',
      description: 'Test untuk seleksi masuk tim Network Management batch 2. Test ini mencakup pemahaman jaringan, protokol, dan troubleshooting.',
      slug: 'test-network-batch-2',
      token: 'network-batch-2-2024',
      serviceType: ServiceType.NETWORK_MANAGEMENT,
      locationId: jakartaUtara?.id,
      isPublished: true,
      expiresAt: new Date('2025-09-15T23:59:59'),
      passingScore: 70,
      questionsPerPage: 4,
      createdBy: 'admin@gms.com',
      createdAt: new Date('2024-01-15T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z'),
    });

    const savedSmQuiz = await quizRepository.save(smQuiz);
    const savedNetQuiz = await quizRepository.save(netQuiz);
    const smQuizId = savedSmQuiz.id;
    const netQuizId = savedNetQuiz.id;

    const smQuestions = [
      {
        order: 1,
        questionText: 'Apa yang dimaksud dengan Service Management dalam konteks IT?',
        questionType: 'multiple-choice' as const,
        options: [
          'Pengelolaan perangkat keras komputer',
          'Pendekatan untuk mengelola layanan IT agar memberikan nilai kepada pelanggan',
          'Software untuk monitoring jaringan',
          'Sistem keamanan IT'
        ],
        correctAnswer: 'Pendekatan untuk mengelola layanan IT agar memberikan nilai kepada pelanggan',
        quizId: smQuizId,
      },
      {
        order: 2,
        questionText: 'ITIL adalah framework yang digunakan dalam Service Management. Apa kepanjangan dari ITIL?',
        questionType: 'multiple-choice' as const,
        options: [
          'Information Technology Infrastructure Library',
          'Internet Technology Integration Logic',
          'IT Implementation and Learning',
          'Information Technical Integration Library'
        ],
        correctAnswer: 'Information Technology Infrastructure Library',
        quizId: smQuizId,
      },
      {
        order: 3,
        questionText: 'Manakah yang BUKAN termasuk dalam lifecycle ITIL v3?',
        questionType: 'multiple-choice' as const,
        options: [
          'Service Strategy',
          'Service Design',
          'Service Operation',
          'Service Development'
        ],
        correctAnswer: 'Service Development',
        quizId: smQuizId,
      },
      {
        order: 4,
        questionText: 'Pilih semua database yang termasuk NoSQL:',
        questionType: 'multiple-select' as const,
        options: [
          'MongoDB',
          'MySQL',
          'Redis',
          'PostgreSQL',
          'Cassandra',
          'CouchDB'
        ],
        correctAnswer: 'MongoDB,Redis,Cassandra,CouchDB',
        quizId: smQuizId,
      },
      {
        order: 5,
        questionText: 'Pilih semua yang termasuk cloud service model:',
        questionType: 'multiple-select' as const,
        options: [
          'IaaS (Infrastructure as a Service)',
          'PaaS (Platform as a Service)',
          'SaaS (Software as a Service)',
          'DaaS (Desktop as a Service)',
          'BaaS (Backend as a Service)',
          'NaaS (Network as a Service)'
        ],
        correctAnswer: 'IaaS (Infrastructure as a Service),PaaS (Platform as a Service),SaaS (Software as a Service)',
        quizId: smQuizId,
      },
    ];

    const netQuestions = [
      {
        order: 1,
        questionText: 'Apa itu Network Topology?',
        questionType: 'multiple-choice' as const,
        options: [
          'Cara perangkat jaringan dihubungkan secara fisik dan logis',
          'Software untuk monitoring jaringan',
          'Protocol komunikasi jaringan',
          'Jenis kabel jaringan'
        ],
        correctAnswer: 'Cara perangkat jaringan dihubungkan secara fisik dan logis',
        quizId: netQuizId,
      },
      {
        order: 2,
        questionText: 'Manakah yang termasuk dalam OSI Layer?',
        questionType: 'multiple-select' as const,
        options: [
          'Physical Layer',
          'Data Link Layer',
          'Network Layer',
          'Session Layer',
          'Application Layer',
          'Security Layer'
        ],
        correctAnswer: 'Physical Layer,Data Link Layer,Network Layer,Session Layer,Application Layer',
        quizId: netQuizId,
      },
      {
        order: 3,
        questionText: 'Apa fungsi utama dari Router?',
        questionType: 'text' as const,
        options: undefined,
        correctAnswer: 'menghubungkan jaringan yang berbeda dan menentukan jalur terbaik untuk pengiriman data',
        quizId: netQuizId,
      },
      {
        order: 4,
        questionText: 'Port default untuk HTTP adalah?',
        questionType: 'multiple-choice' as const,
        options: ['21', '22', '80', '443'],
        correctAnswer: '80',
        quizId: netQuizId,
      },
    ];

    await questionRepository.save([...smQuestions, ...netQuestions]);
    
    console.log(`✓ Seeded 2 quizzes with ${smQuestions.length + netQuestions.length} questions`);
  }

  private async seedAttempts(): Promise<void> {
    const attemptRepository = this.dataSource.getRepository(Attempt);
    const quizRepository = this.dataSource.getRepository(Quiz);
    
    // Check if attempts already exist
    const existingAttempts = await attemptRepository.count();
    if (existingAttempts > 0) {
      console.log(`✓ Attempts already exist (${existingAttempts} attempts), skipping seeding`);
      return;
    }
    
    const smQuiz = await quizRepository.findOne({ where: { slug: 'test-sm-batch-1' } });
    const netQuiz = await quizRepository.findOne({ where: { slug: 'test-network-batch-2' } });
    
    if (!smQuiz || !netQuiz) {
      console.log('❌ Quizzes not found for seeding attempts');
      return;
    }

    const attempts = [
      {
        quizId: smQuiz.id,
        participantName: 'Ahmad Rizki Pratama',
        email: 'ahmad.rizki@gms.com',
        nij: 'SM001',
        score: 8,
        passed: true,
        submittedAt: new Date('2025-08-20T14:30:00'),
      },
      {
        quizId: smQuiz.id,
        participantName: 'Sari Dewi Kusuma',
        email: 'sari.dewi@gms.com',
        nij: 'SM002',
        score: 9,
        passed: true,
        submittedAt: new Date('2025-08-20T15:45:00'),
      },
      {
        quizId: netQuiz.id,
        participantName: 'Budi Santoso',
        email: 'budi.santoso@gms.com',
        nij: 'NET001',
        score: 7,
        passed: true,
        submittedAt: new Date('2025-08-25T10:15:00'),
      },
    ];

    await attemptRepository.save(attempts);
    console.log(`✓ Seeded ${attempts.length} attempts`);
  }
}