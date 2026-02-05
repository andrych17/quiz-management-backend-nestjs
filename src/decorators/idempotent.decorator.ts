import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'idempotent';

/**
 * Decorator to mark endpoints as idempotent
 * Prevents duplicate submissions using idempotency keys
 */
export const Idempotent = (ttlSeconds: number = 300) =>
  SetMetadata(IDEMPOTENT_KEY, { enabled: true, ttl: ttlSeconds });
