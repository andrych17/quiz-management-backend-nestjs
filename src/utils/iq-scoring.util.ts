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
  0: 73,
  1: 73,
  2: 73,
  3: 73,
  4: 73,
  5: 73,
  6: 73,
  7: 73,
  8: 77,
  9: 79,
  10: 84,
  11: 84,
  12: 88,
  13: 88,
  14: 92,
  15: 92,
  16: 94,
  17: 94,
  18: 98,
  19: 98,
  20: 101,
  21: 101,
  22: 104,
  23: 104,
  24: 108,
  25: 108,
  26: 112,
  27: 112,
  28: 116,
  29: 116,
  30: 120,
  31: 120,
  32: 123,
  33: 125,
  34: 132,
  35: 139,
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
