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
      'config_items',
    ];

    for (const entity of entities) {
      await this.dataSource.query(`DELETE FROM "${entity}"`);
    }

    console.log('✓ Database cleared');
  }

  private async seedConfigItems(): Promise<void> {
    const configRepository = this.dataSource.getRepository(ConfigItem);

    const configs = [
      // Locations (isDisplayToUser is null/not set - only relevant for services)
      {
        group: 'locations',
        key: 'all_locations',
        value: 'All Locations',
        description: 'Access to all locations',
        order: 0,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'locations',
        key: 'surabaya',
        value: 'Surabaya',
        description: 'Surabaya',
        order: 1,
        isActive: true,
        createdBy: 'system',
      },

      // Services (isDisplayToUser determines if shown in public quiz dropdown)
      {
        group: 'services',
        key: 'all_services',
        value: 'All Services',
        description: 'Access to all services',
        order: 0,
        isActive: true,
        isDisplayToUser: false,
        createdBy: 'system',
      },
      {
        group: 'services',
        key: 'art_ministry',
        value: 'Art Ministry',
        description: 'Art Ministry Services',
        order: 1,
        isActive: true,
        isDisplayToUser: true,
        createdBy: 'system',
      },
      {
        group: 'services',
        key: 'service_ministry',
        value: 'Service Ministry',
        description: 'Service Ministry Services',
        order: 2,
        isActive: true,
        isDisplayToUser: true,
        createdBy: 'system',
      },
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
        email: 'admin.art@gms.com',
        name: 'Admin Art Ministry',
        password,
        role: 'admin' as const,
        serviceKey: 'art_ministry',
        locationKey: 'surabaya',
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        email: 'admin.service@gms.com',
        name: 'Admin Service Ministry',
        password,
        role: 'admin' as const,
        serviceKey: 'service_ministry',
        locationKey: 'surabaya',
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
    console.log('\n📊 Creating Quiz 1: Logical Test (IQ Scoring)...');

    const quizIQ = await quizRepository.save({
      title: 'Logical Test - IQ Scoring',
      description:
        'Tes logika komprehensif dengan 35 soal meliputi deret angka, analogi, silogisme, dan pola gambar. Menggunakan sistem penilaian IQ.',
      slug: 'logical-test-iq-scoring',
      token: 'LOGIC-IQ-' + Date.now(),
      locationKey: 'surabaya',
      serviceKey: 'art_ministry',
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

    console.log(
      `✓ Quiz 1 created with ${questionsIQ.length} questions and IQ scoring`,
    );

    // ==================== QUIZ 2: DEFAULT SCORING ====================
    console.log('\n📊 Creating Quiz 2: Logical Test (Percentage Scoring)...');

    const quizStandard = await quizRepository.save({
      title: 'Logical Test - Standard Scoring',
      description:
        'Tes logika standar dengan 35 soal meliputi deret angka, analogi, silogisme, dan pola gambar. Menggunakan sistem penilaian persentase (setiap jawaban benar = ~2.857 poin).',
      slug: 'logical-test-standard-scoring',
      token: 'LOGIC-STD-' + Date.now(),
      locationKey: 'surabaya',
      serviceKey: 'service_ministry',
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

    console.log(
      `✓ Quiz 2 created with ${questionsStandard.length} questions and percentage scoring`,
    );
  }

  private generateQuestions(quizId: number): any[] {
    return [
      // LOGICAL TEST - 35 Questions
      // Soal 1: Kata yang tidak berhubungan
      {
        quizId,
        questionText:
          '1. Kata manakah yang tidak ada hubungannya dengan keempat kata lainnya?',
        questionType: 'multiple-choice',
        options: ['Kereta', 'Jembatan', 'Becak', 'Taxi', 'Helikopter'],
        correctAnswer: 'Jembatan',
        order: 1,
      },

      // Soal 2: Deret angka (+2, -1 pattern)
      {
        quizId,
        questionText:
          '2. Angka manakah yang menjadi kelanjutan deret di bawah ini? 10, 12, 11, 13, 12, 14, ...',
        questionType: 'multiple-choice',
        options: ['10', '11', '12', '13', '15'],
        correctAnswer: '13',
        order: 2,
      },

      // Soal 3: Logika bebek
      {
        quizId,
        questionText:
          '3. Ada 2 ekor bebek di Kolam A dan 3 ekor bebek di Kolam B. 1 ekor bebek dari Kolam A dan 2 ekor bebek di Kolam B pindah ke Danau C. Berapa sisa Bebek di Kolam B?',
        questionType: 'multiple-choice',
        options: ['3', '2', '0', '1', 'Tidak ada jawaban yang benar'],
        correctAnswer: '1',
        order: 3,
      },

      // Soal 4: Hitung harga tanah
      {
        quizId,
        questionText:
          '4. Cara bagaimana yang harus dilakukan untuk mencari harga tanah seluas 1m persegi, jika diketahui harga 10 kali 10 meter sama dengan Rp. 1000?',
        questionType: 'multiple-choice',
        options: [
          'Dijumlah dan dikalikan',
          'Dikalikan dan dikalikan',
          'Dikalikan dan dibagi',
          'Dijumlah dan dibagi',
          'Tidak ada yang benar',
        ],
        correctAnswer: 'Dikalikan dan dibagi',
        order: 4,
      },

      // Soal 5: Deret angka (+2, -5 alternating)
      {
        quizId,
        questionText:
          '5. Angka manakah yang menjadi kelanjutan deret angka di bawah ini: 10, 5, 12, 7, 14, ....',
        questionType: 'multiple-choice',
        options: ['13', '9', '10', '6', '5'],
        correctAnswer: '9',
        order: 5,
      },

      // Soal 6: Harga kursi
      {
        quizId,
        questionText:
          '6. Jika seseorang menjual barang-barang dengan harga 1/2 dari harga semula, dan ia menjual kursi dengan harga Rp. 50. Berapa harga kursi itu semula?',
        questionType: 'multiple-choice',
        options: ['80', '120', '150', '100', '110'],
        correctAnswer: '100',
        order: 6,
      },

      // Soal 7: Titik meteran
      {
        quizId,
        questionText:
          '7. Titik X sebuah meteran ada di angka 1000 cm. Jika titik A ada di 2 m di kiri dari titik X maka di angka berapakah titik A?',
        questionType: 'multiple-choice',
        options: ['600', '700', '800', '900', '1000'],
        correctAnswer: '800',
        order: 7,
      },

      // Soal 8: Analogi es-air
      {
        quizId,
        questionText: '8. Es menjadi air adalah sama dengan air menjadi?',
        questionType: 'multiple-choice',
        options: ['Dingin', 'Panas', 'Uap', 'Cair', 'Beku'],
        correctAnswer: 'Uap',
        order: 8,
      },

      // Soal 9: Analogi pekan-tahun
      {
        quizId,
        questionText:
          '9. Bila pasangan "pekan-senin", maka pasangan "tahun-..." adalah?',
        questionType: 'multiple-choice',
        options: ['Bulan', 'Hari', 'Januari', 'Musim Semi', 'Senin'],
        correctAnswer: 'Januari',
        order: 9,
      },

      // Soal 10: Titik meteran A dan B
      {
        quizId,
        questionText:
          '10. Titik X sebuah meteran ada di angka 800 cm. Jika titik A ada di 1,5 m di kiri dari titik X dan titik B ada di 2 m di kanan dari titik X maka di angka berapakah titik A dan B?',
        questionType: 'multiple-choice',
        options: [
          'A di 600 cm, B di 950 cm',
          'A di 650 cm dan B di 900 cm',
          'A di 650 cm dan B di 1000 cm',
          'A di 750 cm dan B di 950 cm',
          'A di 750 cm dan B di 1000 cm',
        ],
        correctAnswer: 'A di 650 cm dan B di 1000 cm',
        order: 10,
      },

      // Soal 11: Silogisme Dian
      {
        quizId,
        questionText:
          '11. Dian adalah siswa sekolah Timur. Seluruh siswa sekolah Timur lulus Ujian. Maka Dian .......',
        questionType: 'multiple-choice',
        options: [
          'Adalah siswa sekolah Barat',
          'Adalah siswa laki-laki',
          'Adalah anak yang malas',
          'Lulus ujian',
          'Tidak lulus ujian',
        ],
        correctAnswer: 'Lulus ujian',
        order: 11,
      },

      // Soal 12: Perbandingan umur
      {
        quizId,
        questionText:
          '12. Adi lebih tua dari Budi. Budi lebih tua dari Cita. Pernyataan mana di bawah ini yang benar:',
        questionType: 'multiple-choice',
        options: [
          'Budi lebih muda dari Cita',
          'Cita lebih tua dari Adi',
          'Cita lebih muda dari Adi',
          'Adi lebih muda dari Cita',
          'Cita lebih tua dari Budi',
        ],
        correctAnswer: 'Cita lebih muda dari Adi',
        order: 12,
      },

      // Soal 13: Dadu
      {
        quizId,
        questionText:
          '13. Jika seseorang melempar dadu 3 kali, berapakah jumlah angka terbesar yang dapat keluar jika satu angka tidak keluar lebih dari 3x?',
        questionType: 'multiple-choice',
        options: ['17', '19', '15', '20', '18'],
        correctAnswer: '18',
        order: 13,
      },

      // Soal 14: Hubungan kata cemburu-pertengkaran
      {
        quizId,
        questionText:
          '14. Carilah hubungan yang paling tepat dari kedua kata ini: "Cemburu - Pertengkaran"',
        questionType: 'multiple-choice',
        options: ['Lawan', 'Sama', 'Terbalik', 'Alat', 'Sebab'],
        correctAnswer: 'Sebab',
        order: 14,
      },

      // Soal 15: Hitung angka 9 setelah 5
      {
        quizId,
        questionText:
          '15. 829529538726592598245795\nBerapakah angka sembilan yang posisinya setelah angka 5?',
        questionType: 'multiple-choice',
        options: ['Satu', 'Dua', 'Tiga', 'Empat', 'Lima'],
        correctAnswer: 'Tiga',
        order: 15,
      },

      // Soal 16: Arah jalan (Barat)
      {
        quizId,
        questionText:
          '16. Seseorang berjalan menuju barat, kemudian ia berbelok ke kanan, kemudian ke kanan lagi, dan akhirnya ke kiri. Ke arah manakah sekarang dia berjalan?',
        questionType: 'multiple-choice',
        options: ['Barat', 'Timur', 'Selatan', 'Utara', 'Tenggara'],
        correctAnswer: 'Utara',
        order: 16,
      },

      // Soal 17: Waktu acara ditunda
      {
        quizId,
        questionText:
          '17. Jika sebuah acara seharusnya dimulai pada pukul 07:55 namun ditunda selama 10 menit. Maka pukul berapa acara akan dimulai?',
        questionType: 'multiple-choice',
        options: ['07:50', '08:00', '08:10', '08:05', '07:05'],
        correctAnswer: '08:05',
        order: 17,
      },

      // Soal 18: Harga gula
      {
        quizId,
        questionText:
          '18. Jika 10 kg gula harganya Rp. 900, berapakah harga 3 kg gula?',
        questionType: 'multiple-choice',
        options: ['270', '320', '370', '420', '470'],
        correctAnswer: '270',
        order: 18,
      },

      // Soal 19: Pola gambar 1 (gambar menyusul)
      {
        quizId,
        questionText:
          '19. Pola yang sesuai untuk mengisi kekosongan pada gambar di bawah ini adalah?',
        questionType: 'multiple-choice',
        options: [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
          'Tidak ada jawaban yang benar',
        ],
        correctAnswer: 'C',
        order: 19,
      },

      // Soal 20: Pola gambar 2 (gambar menyusul)
      {
        quizId,
        questionText:
          '20. Pola yang sesuai untuk mengisi kekosongan pada gambar di bawah ini adalah?',
        questionType: 'multiple-choice',
        options: [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
          'Tidak ada jawaban yang benar',
        ],
        correctAnswer: 'D',
        order: 20,
      },

      // Soal 21: Urutan mic
      {
        quizId,
        questionText:
          '21. Berikut urutan mic dari kiri ke kanan: S1, S2, S3, S4, W2, W1, S5, S6, S7, S8\n\nKemudian posisi, S2 ditukar dengan S7, S4 ditukar dengan S6, W2 ditukar dengan S5. Maka urutan mic saat ini adalah:',
        questionType: 'multiple-choice',
        options: [
          'S1, S6, S3, S7, W2, W1, S5, S2, S4, S8',
          'S1, S6, S3, S4, S5, W1, W2, S2, S7, S8',
          'S1, S7, S3, S6, S5, W1, W2, S4, S2, S8',
          'S1, S7, S3, S6, W1, W2, S5, S4, S2, S8',
          'S1, S7, S3, S6, W2, W1, S5, S4, S2, S8',
        ],
        correctAnswer: 'S1, S7, S3, S6, S5, W1, W2, S4, S2, S8',
        order: 21,
      },

      // Soal 22: Waktu wajib datang
      {
        quizId,
        questionText:
          '22. Semua anggota wajib datang 1 Jam 15 Menit sebelum acara dimulai. Jika acara mulai pukul 1 siang, maka Bima wajib datang pukul?',
        questionType: 'multiple-choice',
        options: ['12:15', '11:45', '13:45', '11:15', '10:45'],
        correctAnswer: '11:45',
        order: 22,
      },

      // Soal 23: Warna celana
      {
        quizId,
        questionText:
          '23. Jika seluruh anggota wajib berpakaian hitam dari baju hingga sepatu, maka Ria harus memakai celana bewarna?',
        questionType: 'multiple-choice',
        options: ['Putih', 'Merah', 'Kuning', 'Biru', 'Tidak ada yang benar'],
        correctAnswer: 'Tidak ada yang benar',
        order: 23,
      },

      // Soal 24: Mesin tenun
      {
        quizId,
        questionText:
          '24. Mesin A menenun 50 m kain, pada waktu yang sama mesin B dapat menenun 25 m kain. Berapa meterkah yang harus ditenun mesin A jika mesin B menenun 50 m kain?',
        questionType: 'multiple-choice',
        options: ['100', '95', '90', '85', '80'],
        correctAnswer: '100',
        order: 24,
      },

      // Soal 25: Deret angka (+3,+4,+4,+5,+5,+6,+7)
      {
        quizId,
        questionText:
          '25. 12, 15, 19, 23, 28, 33, 39, ....\n\nAngka berapakah yang paling tepat untuk melanjutkan deret ini?',
        questionType: 'multiple-choice',
        options: ['42', '45', '43', '49', '46'],
        correctAnswer: '46',
        order: 25,
      },

      // Soal 26: Urutan menyalakan lampu
      {
        quizId,
        questionText:
          '26. Urutan lampu gedung dari depan ke belakang adalah: F10, F13, F12, F11\n\nJika menyalakan lampu harus dari belakang ke depan, maka urutan menyalakan lampunya adalah?',
        questionType: 'multiple-choice',
        options: [
          'F10, F13, F12, F11',
          'F13, F12, F11, F10',
          'F11, F12, F13, F10',
          'F10, F11, F12, F13',
          'F12, F11, F10, F13',
        ],
        correctAnswer: 'F11, F12, F13, F10',
        order: 26,
      },

      // Soal 27: Jumlah baris kursi
      {
        quizId,
        questionText:
          '27. Di dalam main hall terdapat 3 baris blok kursi: A, B, dan C. Setiap blok memiliki 6 baris. Maka ada berapa jumlah baris di main hall?',
        questionType: 'multiple-choice',
        options: ['6', '3', '20', '12', '18'],
        correctAnswer: '18',
        order: 27,
      },

      // Soal 28: Penyanyi/pemusik naik panggung
      {
        quizId,
        questionText:
          '28. Setiap penyanyi akan naik dari sisi kiri. Setiap pemusik akan naik dari sisi kanan. Jenny adalah pemain keyboard, maka ia .....',
        questionType: 'multiple-choice',
        options: [
          'Pasti naik dari sisi kiri',
          'Pasti naik dari kanan',
          'Bisa naik dari kiri dan kanan',
          'Pasti naik dari depan',
          'Tidak ada jawaban yang benar',
        ],
        correctAnswer: 'Pasti naik dari kanan',
        order: 28,
      },

      // Soal 29: Arah jalan (Timur)
      {
        quizId,
        questionText:
          '29. Seseorang berjalan menuju Timur, kemudian ia berbelok ke kiri, kemudian ke kanan lagi, dan akhirnya ke kanan. Ke arah manakah sekarang dia berjalan?',
        questionType: 'multiple-choice',
        options: ['Selatan', 'Utara', 'Barat', 'Timur', 'Tenggara'],
        correctAnswer: 'Selatan',
        order: 29,
      },

      // Soal 30: Urutan mematikan lampu
      {
        quizId,
        questionText:
          '30. Urutan lampu gedung dari depan ke belakang adalah: F10, F13, F12, F11\n\nSaat ini posisi lampu sedang menyala semuanya, Fanny ingin hanya lampu F11 yang menyala. Jika urutan mematikan lampu adalah dari depan ke belakang, maka urutan lampu yang Fanny harus matikan adalah?',
        questionType: 'multiple-choice',
        options: [
          'F12, F13, F10',
          'F13, F12, F10',
          'F12, F13, F10, F11',
          'F11, F12, F13, F10',
          'F10, F13, F12',
        ],
        correctAnswer: 'F10, F13, F12',
        order: 30,
      },

      // Soal 31: Waktu pulang pergi
      {
        quizId,
        questionText:
          '31. Seseorang bertempat tinggal satu kilometer dari tempat kerjanya. Jika ia berjalan dengan kecepatan 3 km/jam, berapa jam yang ia gunakan untuk pulang pergi bekerja selama 1 minggu (6 hari)?',
        questionType: 'multiple-choice',
        options: ['3 Jam', '4 Jam', '8 Jam', '10 Jam', '12 Jam'],
        correctAnswer: '4 Jam',
        order: 31,
      },

      // Soal 32: Pola gambar 3 (gambar menyusul)
      {
        quizId,
        questionText:
          '32. Pola yang sesuai untuk mengisi kekosongan pada gambar di bawah ini adalah?',
        questionType: 'multiple-choice',
        options: [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
          'Tidak ada jawaban yang benar',
        ],
        correctAnswer: 'B',
        order: 32,
      },

      // Soal 33: Pola gambar 4 (gambar menyusul)
      {
        quizId,
        questionText:
          '33. Pola yang sesuai untuk mengisi kekosongan pada gambar di bawah ini adalah?',
        questionType: 'multiple-choice',
        options: [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
          'Tidak ada jawaban yang benar',
        ],
        correctAnswer: 'E',
        order: 33,
      },

      // Soal 34: Titik meteran A, B, C
      {
        quizId,
        questionText:
          '34. Titik X sebuah meteran ada di angka 750 cm. Jika titik A ada di 1,5 m di kiri dari titik X dan titik B ada di 2 m di kiri dari titik A, dan titik C ada di 3 m di kanan dari titik A maka di angka berapakah titik A, B dan C?',
        questionType: 'multiple-choice',
        options: [
          'A di 600 cm, B di 550 cm, dan C di 850 cm',
          'A di 600 cm, B di 400 cm, dan C di 1050 cm',
          'A di 900 cm, B di 700 cm, dan C di 1200 cm',
          'A di 600 cm, B di 400 cm, dan C di 900 cm',
          'A di 900 cm, B di 1100 cm, dan C di 1200 cm',
        ],
        correctAnswer: 'A di 600 cm, B di 400 cm, dan C di 900 cm',
        order: 34,
      },

      // Soal 35: Hubungan kata sekolah-mendidik
      {
        quizId,
        questionText:
          '35. Carilah hubungan yang paling tepat dari kedua kata ini: "sekolah-mendidik". Jawabannya adalah?',
        questionType: 'multiple-choice',
        options: ['Lawan', 'Bagian', 'Jenis', 'Tempat', 'Akibat'],
        correctAnswer: 'Tempat',
        order: 35,
      },
    ];
  }

  private generateIQScoring(quizId: number): any[] {
    return [
      // 0-7 correct: Score 73
      ...Array(8)
        .fill(0)
        .map((_, i) => ({
          quizId,
          correctAnswers: i,
          points: 73,
          isActive: true,
          createdBy: 'superadmin@gms.com',
          updatedBy: 'superadmin@gms.com',
        })),
      // 8-11 correct: Score 77-84
      {
        quizId,
        correctAnswers: 8,
        points: 77,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 9,
        points: 79,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 10,
        points: 84,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 11,
        points: 84,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      // 12-15 correct: Score 88-92
      {
        quizId,
        correctAnswers: 12,
        points: 88,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 13,
        points: 88,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 14,
        points: 92,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 15,
        points: 92,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      // 16-19 correct: Score 94-98
      {
        quizId,
        correctAnswers: 16,
        points: 94,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 17,
        points: 94,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 18,
        points: 98,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 19,
        points: 98,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      // 20-23 correct: Score 101-104
      {
        quizId,
        correctAnswers: 20,
        points: 101,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 21,
        points: 101,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 22,
        points: 104,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 23,
        points: 104,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      // 24-27 correct: Score 108-112
      {
        quizId,
        correctAnswers: 24,
        points: 108,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 25,
        points: 108,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 26,
        points: 112,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 27,
        points: 112,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      // 28-31 correct: Score 116-120
      {
        quizId,
        correctAnswers: 28,
        points: 116,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 29,
        points: 116,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 30,
        points: 120,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 31,
        points: 120,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      // 32-35 correct: Score 123-139
      {
        quizId,
        correctAnswers: 32,
        points: 123,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 33,
        points: 125,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 34,
        points: 132,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
      {
        quizId,
        correctAnswers: 35,
        points: 139,
        isActive: true,
        createdBy: 'superadmin@gms.com',
        updatedBy: 'superadmin@gms.com',
      },
    ];
  }
}
