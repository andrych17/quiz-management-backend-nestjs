/**
 * Utility functions for datetime formatting
 */

/**
 * Convert Date to WIB (GMT+7) formatted string
 * @param date - Date object or ISO string
 * @returns Formatted string in WIB timezone (e.g., "04/02/2026, 18:00:00 WIB")
 */
export function toWIB(date: Date | string | null): string | null {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Format to WIB (GMT+7)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat('id-ID', options);
  return `${formatter.format(dateObj)} WIB`;
}

/**
 * Get attempt status based on current state
 * @param attempt - Attempt object with submittedAt and endDateTime
 * @returns Status string: 'completed', 'in_progress', 'expired'
 */
export function getAttemptStatus(attempt: {
  submittedAt: Date | null;
  endDateTime: Date | null;
}): string {
  // If submitted, status is completed
  if (attempt.submittedAt) {
    return 'completed';
  }

  // If not submitted, check if time expired
  if (attempt.endDateTime) {
    const now = new Date();
    const endTime = new Date(attempt.endDateTime);

    if (now > endTime) {
      return 'expired';
    }
  }

  // Not submitted and not expired = in progress
  return 'in_progress';
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: 'Selesai',
    in_progress: 'Sedang Dikerjakan',
    expired: 'Waktu Habis',
  };

  return labels[status] || status;
}
