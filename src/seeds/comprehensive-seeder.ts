import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Quiz, Question, ConfigItem, UserQuizAssignment } from '../entities';
import { ServiceType, QuizType } from '../dto/quiz.dto';

export class ComprehensiveSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('🌱 Starting comprehensive database seeding...');

    await this.seedConfigItems();
    await this.seedUsers();
    await this.seedQuizzes();
    await this.seedUserQuizAssignments();

    console.log('✅ Comprehensive database seeding completed!');
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
      // App configs
      {
        group: 'app',
        key: 'name',
        value: 'Logic Test GMS Church',
        description: 'Application name',
        order: 1,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'app',
        key: 'version',
        value: '1.0.0',
        description: 'Application version',
        order: 2,
        isActive: true,
        createdBy: 'system',
      },
      
      // Service configs
      {
        group: 'service',
        key: 'all_services',
        value: 'All Services',
        description: 'Access to all services (superadmin)',
        order: 0,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'service_management',
        value: 'Service Management (SM)',
        description: 'Service Management division',
        order: 1,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'asset_management',
        value: 'Asset Management (AM)',
        description: 'Asset Management division',
        order: 2,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'technical_support',
        value: 'Technical Support',
        description: 'Technical Support division',
        order: 3,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'network_admin',
        value: 'Network Administrator',
        description: 'Network Administration division',
        order: 4,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'database_admin',
        value: 'Database Administrator',
        description: 'Database Administration division',
        order: 5,
        isActive: true,
        createdBy: 'system',
      },

      // Location configs
      {
        group: 'location',
        key: 'all_locations',
        value: 'All Locations',
        description: 'Access to all locations (superadmin)',
        order: 0,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'location',
        key: 'jakarta_pusat',
        value: 'Jakarta Pusat',
        description: 'Jakarta Central location',
        order: 1,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'location',
        key: 'jakarta_utara',
        value: 'Jakarta Utara',
        description: 'Jakarta North location',
        order: 2,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'location',
        key: 'jakarta_selatan',
        value: 'Jakarta Selatan',
        description: 'Jakarta South location',
        order: 3,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'location',
        key: 'jakarta_barat',
        value: 'Jakarta Barat',
        description: 'Jakarta West location',
        order: 4,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'location',
        key: 'jakarta_timur',
        value: 'Jakarta Timur',
        description: 'Jakarta East location',
        order: 5,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'location',
        key: 'tangerang',
        value: 'Tangerang',
        description: 'Tangerang location',
        order: 6,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'location',
        key: 'bekasi',
        value: 'Bekasi',
        description: 'Bekasi location',
        order: 7,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'location',
        key: 'depok',
        value: 'Depok',
        description: 'Depok location',
        order: 8,
        isActive: true,
        createdBy: 'system',
      },
    ];

    await configRepository.save(configs);
    console.log(`✓ Seeded ${configs.length} config items`);
  }

  private async seedUsers(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);
    const configRepository = this.dataSource.getRepository(ConfigItem);
    
    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log(`✓ Users already exist (${existingUsers} users), skipping seeding`);
      return;
    }
    
    // No need to fetch config items anymore, we'll use keys directly
    
    // Hash passwords
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);
    
    const users = [
      // Superadmin
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
      
      // Service Management Admins
      {
        email: 'admin.sm@gms.com',
        name: 'Admin Service Management',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'sm',
        locationKey: 'jakarta_pusat',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'bambang.sm@gms.com',
        name: 'Bambang Sutrisno (SM)',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'sm',
        locationKey: 'jakarta_utara',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'sari.sm@gms.com',
        name: 'Sari Dewi Kusuma (SM)',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'sm',
        locationKey: 'jakarta_selatan',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      
      // Asset Management Admins
      {
        email: 'admin.am@gms.com',
        name: 'Admin Asset Management',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'am',
        locationKey: 'jakarta_pusat',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'andi.am@gms.com',
        name: 'Andi Prasetyo (AM)',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'am',
        locationKey: 'jakarta_utara',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'lisa.am@gms.com',
        name: 'Lisa Handayani (AM)',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'am',
        locationKey: 'jakarta_selatan',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      
      // Technical Support Admins
      {
        email: 'admin.tech@gms.com',
        name: 'Admin Technical Support',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'technical_support',
        locationKey: 'jakarta_pusat',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        email: 'budi.tech@gms.com',
        name: 'Budi Santoso (Tech)',
        password: defaultPassword,
        role: 'admin' as const,
        serviceKey: 'technical_support',
        locationKey: 'jakarta_utara',
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      
      // Regular Users
      {
        email: 'user1@gms.com',
        name: 'Ahmad Rizki Pratama',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'jakarta_pusat',
        isActive: true,
        createdBy: 'admin.sm@gms.com',
        updatedBy: 'admin.sm@gms.com',
      },
      {
        email: 'user2@gms.com',
        name: 'Dewi Lestari',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'jakarta_utara',
        isActive: true,
        createdBy: 'admin.am@gms.com',
        updatedBy: 'admin.am@gms.com',
      },
      {
        email: 'user3@gms.com',
        name: 'Rudi Hermawan',
        password: defaultPassword,
        role: 'user' as const,
        serviceKey: null,
        locationKey: 'jakarta_selatan',
        isActive: true,
        createdBy: 'admin.tech@gms.com',
        updatedBy: 'admin.tech@gms.com',
      },
    ];

    await userRepository.save(users);
    console.log(`✓ Seeded ${users.length} users with hashed passwords`);
  }

  private async seedQuizzes(): Promise<void> {
    const quizRepository = this.dataSource.getRepository(Quiz);
    const questionRepository = this.dataSource.getRepository(Question);
    
    // Check if quizzes already exist
    const existingQuizzes = await quizRepository.count();
    if (existingQuizzes > 0) {
      console.log(`✓ Quizzes already exist (${existingQuizzes} quizzes), skipping seeding`);
      return;
    }
    
    // Quiz 1: Service Management - Jakarta Pusat
    const smQuiz = quizRepository.create({
      title: 'Test Masuk Service Management Jakarta Pusat',
      description: 'Test untuk seleksi masuk tim Service Management di Jakarta Pusat. Test ini mencakup pemahaman ITIL, service desk, dan manajemen layanan IT.',
      slug: 'test-sm-jakarta-pusat',
      token: 'sm-jkt-pusat-2024',
      serviceType: ServiceType.SERVICE_MANAGEMENT,
      quizType: QuizType.SCHEDULED,
      serviceKey: 'sm',
      locationKey: 'jakarta_pusat',
      isPublished: true,
      isActive: true,
      startDateTime: new Date('2024-12-01T08:00:00Z'),
      endDateTime: new Date('2025-01-31T23:59:59Z'),
      passingScore: 70,
      questionsPerPage: 5,
      durationMinutes: 60,
      createdBy: 'admin.sm@gms.com',
    });

    // Quiz 2: Asset Management - Jakarta Utara  
    const amQuiz = quizRepository.create({
      title: 'Test Asset Management Jakarta Utara',
      description: 'Test untuk seleksi masuk tim Asset Management di Jakarta Utara. Test ini mencakup pemahaman manajemen aset IT, inventarisasi, dan maintenance.',
      slug: 'test-am-jakarta-utara',
      token: 'am-jkt-utara-2024',
      serviceType: ServiceType.SYSTEM_ADMIN,
      quizType: QuizType.SCHEDULED,
      serviceKey: 'am',
      locationKey: 'jakarta_utara',
      isPublished: true,
      isActive: true,
      startDateTime: new Date('2024-12-15T08:00:00Z'),
      endDateTime: new Date('2025-02-15T23:59:59Z'),
      passingScore: 75,
      questionsPerPage: 4,
      durationMinutes: 90,
      createdBy: 'admin.am@gms.com',
    });

    // Quiz 3: Technical Support - Jakarta Selatan
    const techQuiz = quizRepository.create({
      title: 'Test Technical Support Jakarta Selatan',
      description: 'Test untuk seleksi masuk tim Technical Support di Jakarta Selatan. Test ini mencakup troubleshooting, customer service, dan technical knowledge.',
      slug: 'test-tech-jakarta-selatan',
      token: 'tech-jkt-selatan-2024',
      serviceType: ServiceType.CYBERSECURITY,
      quizType: QuizType.MANUAL,
      serviceKey: 'technical_support',
      locationKey: 'jakarta_selatan',
      isPublished: false,
      isActive: true,
      startDateTime: null,
      endDateTime: null,
      passingScore: 65,
      questionsPerPage: 3,
      durationMinutes: 45,
      createdBy: 'admin.tech@gms.com',
    });

    const savedSmQuiz = await quizRepository.save(smQuiz);
    const savedAmQuiz = await quizRepository.save(amQuiz);
    const savedTechQuiz = await quizRepository.save(techQuiz);

    // Questions for SM Quiz
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
        points: 10,
        isRequired: true,
        quizId: savedSmQuiz.id,
        createdBy: 'admin.sm@gms.com',
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
        points: 10,
        isRequired: true,
        quizId: savedSmQuiz.id,
        createdBy: 'admin.sm@gms.com',
      },
      {
        order: 3,
        questionText: 'Pilih semua yang termasuk dalam ITIL Service Lifecycle:',
        questionType: 'multiple-select' as const,
        options: [
          'Service Strategy',
          'Service Design',
          'Service Transition',
          'Service Operation',
          'Continual Service Improvement',
          'Service Development'
        ],
        correctAnswer: 'Service Strategy,Service Design,Service Transition,Service Operation,Continual Service Improvement',
        points: 15,
        isRequired: true,
        quizId: savedSmQuiz.id,
        createdBy: 'admin.sm@gms.com',
      },
      {
        order: 4,
        questionText: 'Jelaskan secara singkat apa itu Incident Management dalam ITIL.',
        questionType: 'text' as const,
        options: null,
        correctAnswer: 'Proses untuk mengembalikan layanan IT normal secepat mungkin setelah terjadi gangguan dan meminimalkan dampak negatif terhadap operasi bisnis',
        points: 15,
        isRequired: true,
        quizId: savedSmQuiz.id,
        createdBy: 'admin.sm@gms.com',
      }
    ];

    // Questions for AM Quiz  
    const amQuestions = [
      {
        order: 1,
        questionText: 'Apa tujuan utama dari Asset Management?',
        questionType: 'multiple-choice' as const,
        options: [
          'Mengurangi jumlah aset perusahaan',
          'Memaksimalkan nilai dan meminimalkan risiko aset',
          'Menjual aset secepat mungkin',
          'Menyimpan aset di gudang'
        ],
        correctAnswer: 'Memaksimalkan nilai dan meminimalkan risiko aset',
        points: 10,
        isRequired: true,
        quizId: savedAmQuiz.id,
        createdBy: 'admin.am@gms.com',
      },
      {
        order: 2,
        questionText: 'Pilih semua yang termasuk dalam lifecycle aset IT:',
        questionType: 'multiple-select' as const,
        options: [
          'Planning',
          'Procurement', 
          'Deployment',
          'Maintenance',
          'Disposal',
          'Marketing'
        ],
        correctAnswer: 'Planning,Procurement,Deployment,Maintenance,Disposal',
        points: 15,
        isRequired: true,
        quizId: savedAmQuiz.id,
        createdBy: 'admin.am@gms.com',
      },
      {
        order: 3,
        questionText: 'Apa itu Configuration Management Database (CMDB)?',
        questionType: 'text' as const,
        options: null,
        correctAnswer: 'Database yang berisi informasi tentang semua Configuration Items (CI) dan hubungan antar CI dalam infrastruktur IT',
        points: 15,
        isRequired: true,
        quizId: savedAmQuiz.id,
        createdBy: 'admin.am@gms.com',
      }
    ];

    // Questions for Tech Quiz
    const techQuestions = [
      {
        order: 1,
        questionText: 'Apa langkah pertama dalam troubleshooting masalah IT?',
        questionType: 'multiple-choice' as const,
        options: [
          'Restart sistem',
          'Identifikasi dan pahami masalah',
          'Ganti hardware',
          'Install ulang software'
        ],
        correctAnswer: 'Identifikasi dan pahami masalah',
        points: 10,
        isRequired: true,
        quizId: savedTechQuiz.id,
        createdBy: 'admin.tech@gms.com',
      },
      {
        order: 2,
        questionText: 'Pilih semua soft skills yang penting untuk Technical Support:',
        questionType: 'multiple-select' as const,
        options: [
          'Komunikasi yang baik',
          'Kesabaran',
          'Empati',
          'Problem solving',
          'Time management',
          'Programming'
        ],
        correctAnswer: 'Komunikasi yang baik,Kesabaran,Empati,Problem solving,Time management',
        points: 15,
        isRequired: true,
        quizId: savedTechQuiz.id,
        createdBy: 'admin.tech@gms.com',
      }
    ];

    await questionRepository.save([...smQuestions, ...amQuestions, ...techQuestions]);
    
    console.log(`✓ Seeded 3 quizzes with ${smQuestions.length + amQuestions.length + techQuestions.length} questions`);
  }

  private async seedUserQuizAssignments(): Promise<void> {
    const assignmentRepository = this.dataSource.getRepository(UserQuizAssignment);
    const userRepository = this.dataSource.getRepository(User);
    const quizRepository = this.dataSource.getRepository(Quiz);
    
    // Check if assignments already exist
    const existingAssignments = await assignmentRepository.count();
    if (existingAssignments > 0) {
      console.log(`✓ User quiz assignments already exist (${existingAssignments} assignments), skipping seeding`);
      return;
    }
    
    // Get users and quizzes
    const smAdmins = await userRepository.find({
      where: { role: 'admin' }
    });
    
    const quizzes = await quizRepository.find();
    
    const assignments = [];
    
    // Auto-assign quizzes based on service and location match
    for (const admin of smAdmins) {
      if (admin.serviceKey && admin.locationKey) {
        const matchingQuizzes = quizzes.filter(quiz => 
          quiz.serviceKey === admin.serviceKey && quiz.locationKey === admin.locationKey
        );
        
        for (const quiz of matchingQuizzes) {
          assignments.push({
            userId: admin.id,
            quizId: quiz.id,
            isActive: true,
            assignedBy: 'system',
            notes: `Auto-assigned based on service and location match`,
            createdBy: 'system',
            updatedBy: 'system',
          });
        }
      }
    }
    
    if (assignments.length > 0) {
      await assignmentRepository.save(assignments);
      console.log(`✓ Seeded ${assignments.length} user quiz assignments`);
    } else {
      console.log('✓ No matching assignments to create');
    }
  }
}