import { IQCategory } from '../entities/quiz-scoring.entity';

/**
 * IQ Score Categories and Ranges
 */
export const IQ_RANGES = {
  GIFTED: { min: 130, max: Infinity, category: IQCategory.GIFTED },
  SUPERIOR: { min: 120, max: 129, category: IQCategory.SUPERIOR },
  HIGH_AVERAGE: { min: 110, max: 119, category: IQCategory.HIGH_AVERAGE },
  AVERAGE: { min: 90, max: 109, category: IQCategory.AVERAGE },
  LOW_AVERAGE: { min: 80, max: 89, category: IQCategory.LOW_AVERAGE },
  BORDERLINE: { min: 0, max: 79, category: IQCategory.BORDERLINE },
} as const;

/**
 * Mapping jumlah jawaban benar ke IQ score
 * Ini adalah contoh mapping - sesuaikan dengan kebutuhan quiz Anda
 *
 * Format: correctAnswers -> iqScore
 */
export const IQ_SCORE_MAPPING: Record<number, number> = {
  0: 70,
  1: 72,
  2: 74,
  3: 76,
  4: 78,
  5: 80,
  6: 82,
  7: 84,
  8: 86,
  9: 88,
  10: 90,
  11: 92,
  12: 94,
  13: 96,
  14: 98,
  15: 100,
  16: 102,
  17: 104,
  18: 106,
  19: 108,
  20: 110,
  21: 112,
  22: 114,
  23: 116,
  24: 118,
  25: 120,
  26: 122,
  27: 124,
  28: 126,
  29: 128,
  30: 130,
  // Tambahkan mapping lainnya sesuai kebutuhan
};

/**
 * Mendapatkan IQ score berdasarkan jumlah jawaban benar
 * @param correctAnswers Jumlah jawaban benar
 * @returns IQ score
 */
export function getIQScore(correctAnswers: number): number {
  // Cek apakah ada mapping langsung
  if (IQ_SCORE_MAPPING[correctAnswers] !== undefined) {
    return IQ_SCORE_MAPPING[correctAnswers];
  }

  // Jika tidak ada mapping langsung, gunakan formula linear
  // Asumsi: setiap jawaban benar = +2 poin IQ, base 70
  return 70 + (correctAnswers * 2);
}

/**
 * Mendapatkan kategori IQ berdasarkan IQ score
 * @param iqScore IQ score
 * @returns IQ category string
 */
export function getIQCategory(iqScore: number): string {
  if (iqScore >= IQ_RANGES.GIFTED.min) {
    return IQ_RANGES.GIFTED.category;
  }
  if (iqScore >= IQ_RANGES.SUPERIOR.min && iqScore <= IQ_RANGES.SUPERIOR.max) {
    return IQ_RANGES.SUPERIOR.category;
  }
  if (iqScore >= IQ_RANGES.HIGH_AVERAGE.min && iqScore <= IQ_RANGES.HIGH_AVERAGE.max) {
    return IQ_RANGES.HIGH_AVERAGE.category;
  }
  if (iqScore >= IQ_RANGES.AVERAGE.min && iqScore <= IQ_RANGES.AVERAGE.max) {
    return IQ_RANGES.AVERAGE.category;
  }
  if (iqScore >= IQ_RANGES.LOW_AVERAGE.min && iqScore <= IQ_RANGES.LOW_AVERAGE.max) {
    return IQ_RANGES.LOW_AVERAGE.category;
  }
  return IQ_RANGES.BORDERLINE.category;
}

/**
 * Mengecek apakah IQ score termasuk kategori Borderline (auto-fail)
 * @param iqScore IQ score
 * @returns true jika borderline (auto-fail), false jika tidak
 */
export function isBorderline(iqScore: number): boolean {
  return iqScore < IQ_RANGES.LOW_AVERAGE.min;
}

/**
 * Mengecek apakah peserta lulus berdasarkan IQ scoring
 * Borderline = otomatis tidak lulus
 * @param iqScore IQ score
 * @returns true jika lulus, false jika tidak
 */
export function passedIQTest(iqScore: number): boolean {
  return !isBorderline(iqScore);
}

/**
 * Calculate IQ score result dengan kategori dan status lulus
 * @param correctAnswers Jumlah jawaban benar
 * @returns Object berisi iqScore, category, dan passed
 */
export function calculateIQResult(correctAnswers: number): {
  iqScore: number;
  category: string;
  passed: boolean;
} {
  const iqScore = getIQScore(correctAnswers);
  const category = getIQCategory(iqScore);
  const passed = passedIQTest(iqScore);

  return {
    iqScore,
    category,
    passed,
  };
}
