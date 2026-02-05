/**
 * Retry utility for handling transient errors
 */
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 10000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const currentDelay = Math.min(
        delayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs,
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * currentDelay;
      const totalDelay = currentDelay + jitter;

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError!;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // HTTP status codes that are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.statusCode && retryableStatusCodes.includes(error.statusCode)) {
    return true;
  }

  // Database deadlock or lock timeout
  if (error.code === '40P01' || error.code === '55P03') {
    return true;
  }

  return false;
}
