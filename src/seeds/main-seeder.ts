import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, ConfigItem, Quiz, Question, QuizScoring } from '../entities';

export class MainSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await this.clearDatabase();

    // Seed data
    await this.seedConfigItems();
    await this.seedUsers();
    await this.seedQuizzes();

    console.log('✅ Database seeding completed!');
  }

  private async clearDatabase(): Promise<void> {
    console.log('🗑️  Clearing existing data...');
    
    const entities = [
      'attempt_answers',
      'attempts', 
      'user_quiz_assignments',
      'quiz_images',
      'quiz_scoring',
      'questions',
      'quizzes',
      'users',
      'config_items'
    ];

    for (const entity of entities) {
      await this.dataSource.query(`DELETE FROM "${entity}"`);
    }

    console.log('✓ Database cleared');
  }

  private async seedConfigItems(): Promise<void> {
    const configRepository = this.dataSource.getRepository(ConfigItem);

    const configs = [
      // Locations
      { group: 'locations', key: 'all_locations', value: 'All Locations', description: 'Access to all locations', order: 0, isActive: true, createdBy: 'system' },
      { group: 'locations', key: 'jakarta', value: 'Jakarta', description: 'DKI Jakarta', order: 1, isActive: true, createdBy: 'system' },
      { group: 'locations', key: 'surabaya', value: 'Surabaya', description: 'Jawa Timur', order: 2, isActive: true, createdBy: 'system' },

      // Services
      { group: 'services', key: 'all_services', value: 'All Services', description: 'Access to all services', order: 0, isActive: true, createdBy: 'system' },
      { group: 'services', key: 'education', value: 'Education', description: 'Education Services', order: 1, isActive: true, createdBy: 'system' },
    ];

    await configRepository.save(configs);
    console.log(`✓ Seeded ${configs.length} config items`);
  }

  private async seedUsers(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);
    const password = await bcrypt.hash('password123', 10);

    const users = [
      {
        email: 'superadmin@gms.com',
        name: 'Super Administrator',
        password,
        role: 'superadmin' as const,
        serviceKey: 'all_services',
        locationKey: 'all_locations',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        email: 'admin.jakarta@gms.com',
        name: 'Admin Jakarta',
        password,
        role: 'admin' as const,
        serviceKey: 'education',
        locationKey: 'jakarta',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    await userRepository.save(users);
    console.log(`✓ Seeded ${users.length} users (password: password123)`);
  }

  private async seedQuizzes(): Promise<void> {
    const quizRepository = this.dataSource.getRepository(Quiz);
    const questionRepository = this.dataSource.getRepository(Question);
    const scoringRepository = this.dataSource.getRepository(QuizScoring);

    // ==================== QUIZ 1: IQ SCORING ====================
    console.log('\n📊 Creating Quiz 1: IQ Scoring...');
    
    const quizIQ = await quizRepository.save({
      title: 'IQ Test - Math & Language',
      description: 'Comprehensive IQ test with 35 questions. Uses IQ-based scoring system.',
      slug: 'iq-test-math-language',
      token: 'IQ-TEST-' + Date.now(),
      locationKey: 'jakarta',
      serviceKey: 'education',
      passingScore: 70,
      questionsPerPage: 10,
      durationMinutes: 45,
      isActive: true,
      isPublished: true,
      startDateTime: new Date('2026-01-01T08:00:00'),
      endDateTime: new Date('2026-12-31T17:00:00'),
      createdBy: 'superadmin@gms.com',
      updatedBy: 'superadmin@gms.com',
    });

    // Create 35 questions
    const questionsIQ = this.generateQuestions(quizIQ.id);
    await questionRepository.save(questionsIQ);

    // Create IQ scoring table (0-35 correct mapped to IQ scores 73-139)
    const scoringIQ = this.generateIQScoring(quizIQ.id);
    await scoringRepository.save(scoringIQ);

    console.log(`✓ Quiz 1 created with ${questionsIQ.length} questions and IQ scoring`);

    // ==================== QUIZ 2: DEFAULT SCORING ====================
    console.log('\n📊 Creating Quiz 2: Default Scoring...');
    
    const quizStandard = await quizRepository.save({
      title: 'Standard Test - Math & Language',
      description: 'Standard test with 35 questions. Uses percentage-based scoring (each correct = ~2.857 points).',
      slug: 'standard-test-math-language',
      token: 'STD-TEST-' + Date.now(),
      locationKey: 'surabaya',
      serviceKey: 'education',
      passingScore: 70,
      questionsPerPage: 10,
      durationMinutes: 45,
      isActive: true,
      isPublished: true,
      startDateTime: new Date('2026-01-01T08:00:00'),
      endDateTime: new Date('2026-12-31T17:00:00'),
      createdBy: 'superadmin@gms.com',
      updatedBy: 'superadmin@gms.com',
    });

    // Create 35 questions (same structure)
    const questionsStandard = this.generateQuestions(quizStandard.id);
    await questionRepository.save(questionsStandard);

    // Create percentage-based scoring
    const scoringStandard = [];
    for (let i = 0; i <= 35; i++) {
      const percentage = Math.round((i / 35) * 100);
      scoringStandard.push({
        quizId: quizStandard.id,
        correctAnswers: i,
        points: percentage,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      });
    }
    await scoringRepository.save(scoringStandard);

    console.log(`✓ Quiz 2 created with ${questionsStandard.length} questions and percentage scoring`);
  }

  private generateQuestions(quizId: number): any[] {
    return [
      // MATH QUESTIONS (20 questions)
      { quizId, questionText: 'What is 15 + 27?', questionType: 'multiple-choice', options: ['40', '42', '44', '45'], correctAnswer: '42', order: 1 },
      { quizId, questionText: 'Berapa hasil dari 48 + 36?', questionType: 'multiple-choice', options: ['82', '84', '86', '88'], correctAnswer: '84', order: 2 },
      { quizId, questionText: 'What is 123 + 456?', questionType: 'multiple-choice', options: ['577', '578', '579', '580'], correctAnswer: '579', order: 3 },
      { quizId, questionText: 'What is 89 - 34?', questionType: 'multiple-choice', options: ['53', '54', '55', '56'], correctAnswer: '55', order: 4 },
      { quizId, questionText: 'Berapa hasil dari 200 - 78?', questionType: 'multiple-choice', options: ['120', '122', '124', '126'], correctAnswer: '122', order: 5 },
      { quizId, questionText: 'What is 500 - 237?', questionType: 'multiple-choice', options: ['261', '262', '263', '264'], correctAnswer: '263', order: 6 },
      { quizId, questionText: 'What is 12 × 8?', questionType: 'multiple-choice', options: ['94', '95', '96', '97'], correctAnswer: '96', order: 7 },
      { quizId, questionText: 'Berapa hasil dari 15 × 6?', questionType: 'multiple-choice', options: ['88', '89', '90', '91'], correctAnswer: '90', order: 8 },
      { quizId, questionText: 'What is 25 × 4?', questionType: 'multiple-choice', options: ['98', '99', '100', '101'], correctAnswer: '100', order: 9 },
      { quizId, questionText: 'Berapa hasil dari 13 × 7?', questionType: 'multiple-choice', options: ['89', '90', '91', '92'], correctAnswer: '91', order: 10 },
      { quizId, questionText: 'What is 144 ÷ 12?', questionType: 'multiple-choice', options: ['10', '11', '12', '13'], correctAnswer: '12', order: 11 },
      { quizId, questionText: 'Berapa hasil dari 96 ÷ 8?', questionType: 'multiple-choice', options: ['10', '11', '12', '13'], correctAnswer: '12', order: 12 },
      { quizId, questionText: 'What is 150 ÷ 6?', questionType: 'multiple-choice', options: ['23', '24', '25', '26'], correctAnswer: '25', order: 13 },
      { quizId, questionText: 'Berapa hasil dari 180 ÷ 15?', questionType: 'multiple-choice', options: ['10', '11', '12', '13'], correctAnswer: '12', order: 14 },
      { quizId, questionText: 'What is (10 + 5) × 2?', questionType: 'multiple-choice', options: ['28', '29', '30', '31'], correctAnswer: '30', order: 15 },
      { quizId, questionText: 'Berapa hasil dari (20 - 8) ÷ 3?', questionType: 'multiple-choice', options: ['3', '4', '5', '6'], correctAnswer: '4', order: 16 },
      { quizId, questionText: 'What is 50 ÷ 5 + 10?', questionType: 'multiple-choice', options: ['18', '19', '20', '21'], correctAnswer: '20', order: 17 },
      { quizId, questionText: 'Berapa hasil dari 7 × 8 - 6?', questionType: 'multiple-choice', options: ['48', '49', '50', '51'], correctAnswer: '50', order: 18 },
      { quizId, questionText: 'What is 100 - 25 + 15?', questionType: 'multiple-choice', options: ['88', '89', '90', '91'], correctAnswer: '90', order: 19 },
      { quizId, questionText: 'Berapa hasil dari 36 ÷ 4 × 2?', questionType: 'multiple-choice', options: ['16', '17', '18', '19'], correctAnswer: '18', order: 20 },

      // LANGUAGE QUESTIONS (15 questions)
      { quizId, questionText: 'What is the synonym of "happy"?', questionType: 'multiple-choice', options: ['Sad', 'Joyful', 'Angry', 'Tired'], correctAnswer: 'Joyful', order: 21 },
      { quizId, questionText: 'Which word is a verb?', questionType: 'multiple-choice', options: ['Beautiful', 'Run', 'Happy', 'Blue'], correctAnswer: 'Run', order: 22 },
      { quizId, questionText: 'What is the antonym of "hot"?', questionType: 'multiple-choice', options: ['Warm', 'Cold', 'Cool', 'Freezing'], correctAnswer: 'Cold', order: 23 },
      { quizId, questionText: 'The word "cat" is a noun. Is this true?', questionType: 'true-false', options: ['True', 'False'], correctAnswer: 'True', order: 24 },
      { quizId, questionText: 'Which sentence is correct?', questionType: 'multiple-choice', options: ['She go to school', 'She goes to school', 'She going to school', 'She gone to school'], correctAnswer: 'She goes to school', order: 25 },
      { quizId, questionText: 'What is the plural of "child"?', questionType: 'multiple-choice', options: ['Childs', 'Children', 'Childes', 'Childrens'], correctAnswer: 'Children', order: 26 },
      { quizId, questionText: 'A verb describes an action. True or false?', questionType: 'true-false', options: ['True', 'False'], correctAnswer: 'True', order: 27 },
      { quizId, questionText: 'Apa sinonim dari "cepat"?', questionType: 'multiple-choice', options: ['Lambat', 'Pelan', 'Kilat', 'Lama'], correctAnswer: 'Kilat', order: 28 },
      { quizId, questionText: 'Kata "berlari" termasuk jenis kata apa?', questionType: 'multiple-choice', options: ['Kata benda', 'Kata kerja', 'Kata sifat', 'Kata keterangan'], correctAnswer: 'Kata kerja', order: 29 },
      { quizId, questionText: 'Apa lawan kata dari "tinggi"?', questionType: 'multiple-choice', options: ['Besar', 'Rendah', 'Kecil', 'Panjang'], correctAnswer: 'Rendah', order: 30 },
      { quizId, questionText: 'Kalimat "Ibu memasak di dapur" benar. True/False?', questionType: 'true-false', options: ['True', 'False'], correctAnswer: 'True', order: 31 },
      { quizId, questionText: 'Apa bentuk jamak dari "buku"?', questionType: 'multiple-choice', options: ['Buku', 'Buku-buku', 'Bukus', 'Bukuan'], correctAnswer: 'Buku-buku', order: 32 },
      { quizId, questionText: 'Kata "indah" adalah kata sifat. Benar?', questionType: 'true-false', options: ['True', 'False'], correctAnswer: 'True', order: 33 },
      { quizId, questionText: 'Manakah kalimat tanya?', questionType: 'multiple-choice', options: ['Hari ini cerah', 'Kemana kamu pergi?', 'Tutup pintunya!', 'Wah luar biasa!'], correctAnswer: 'Kemana kamu pergi?', order: 34 },
      { quizId, questionText: 'Awalan "ber-" membentuk kata kerja. Benar?', questionType: 'true-false', options: ['True', 'False'], correctAnswer: 'True', order: 35 },
    ];
  }

  private generateIQScoring(quizId: number): any[] {
    return [
      // 0-7 correct: Score 73
      ...Array(8).fill(0).map((_, i) => ({ quizId, correctAnswers: i, points: 73, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' })),
      // 8-11 correct: Score 77-84
      { quizId, correctAnswers: 8, points: 77, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 9, points: 79, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 10, points: 84, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 11, points: 84, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      // 12-15 correct: Score 88-92
      { quizId, correctAnswers: 12, points: 88, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 13, points: 88, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 14, points: 92, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 15, points: 92, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      // 16-19 correct: Score 94-98
      { quizId, correctAnswers: 16, points: 94, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 17, points: 94, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 18, points: 98, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 19, points: 98, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      // 20-23 correct: Score 101-104
      { quizId, correctAnswers: 20, points: 101, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 21, points: 101, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 22, points: 104, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 23, points: 104, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      // 24-27 correct: Score 108-112
      { quizId, correctAnswers: 24, points: 108, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 25, points: 108, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 26, points: 112, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 27, points: 112, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      // 28-31 correct: Score 116-120
      { quizId, correctAnswers: 28, points: 116, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 29, points: 116, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 30, points: 120, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 31, points: 120, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      // 32-35 correct: Score 123-139
      { quizId, correctAnswers: 32, points: 123, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 33, points: 125, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 34, points: 132, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
      { quizId, correctAnswers: 35, points: 139, isActive: true, createdBy: 'superadmin@gms.com', updatedBy: 'superadmin@gms.com' },
    ];
  }
}
