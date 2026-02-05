import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator';

/**
 * In-memory cache for idempotency keys
 * NOTE: This works perfectly for single-instance deployments (like Render free/starter tier)
 * For multi-instance deployments, consider using Redis
 * 
 * Memory usage estimate: ~1KB per cached response
 * With 5-minute TTL and 100 req/sec, max ~30MB memory used
 */
const idempotencyCache = new Map<
  string,
  { response: any; timestamp: number }
>();

// Track cache statistics for monitoring
const cacheStats = {
  hits: 0,
  misses: 0,
  size: 0,
  lastCleanup: Date.now(),
};

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(private reflector: Reflector) {
    // Start cleanup interval on instantiation
    this.startCleanupInterval();
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const idempotentMetadata = this.reflector.get(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );

    if (!idempotentMetadata?.enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      // Idempotency key is optional, proceed without caching
      return next.handle();
    }

    // Check cache
    const cached = idempotencyCache.get(idempotencyKey);
    const now = Date.now();
    const ttlMs = (idempotentMetadata.ttl || 300) * 1000;

    if (cached) {
      // Check if cache is still valid
      if (now - cached.timestamp < ttlMs) {
        // Cache hit - return cached response
        cacheStats.hits++;
        return of(cached.response);
      } else {
        // Cache expired, remove it
        idempotencyCache.delete(idempotencyKey);
        cacheStats.size = idempotencyCache.size;
      }
    }

    // Cache miss
    cacheStats.misses++;

    // Execute request and cache response
    return next.handle().pipe(
      tap((response) => {
        idempotencyCache.set(idempotencyKey, {
          response,
          timestamp: now,
        });
        cacheStats.size = idempotencyCache.size;
      }),
    );
  }

  private startCleanupInterval() {
    // Run cleanup every 60 seconds to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries(300000); // Default 5 min TTL
      cacheStats.lastCleanup = Date.now();
    }, 60000);
  }

  private cleanupExpiredEntries(ttlMs: number) {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, value] of idempotencyCache.entries()) {
      if (now - value.timestamp > ttlMs) {
        idempotencyCache.delete(key);
        removed++;
      }
    }
    
    cacheStats.size = idempotencyCache.size;
    
    if (removed > 0) {
      console.log(`[Idempotency] Cleaned up ${removed} expired entries. Current cache size: ${cacheStats.size}`);
    }
  }

  onModuleDestroy() {
    // Clean up interval on module destroy
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Clear all idempotency cache (for testing)
 */
export function clearIdempotencyCache() {
  idempotencyCache.clear();
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.size = 0;
}

/**
 * Get cache statistics (for monitoring/debugging)
 */
export function getIdempotencyCacheStats() {
  return {
    ...cacheStats,
    hitRate: cacheStats.hits + cacheStats.misses > 0 
      ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2) + '%'
      : '0%',
  };
}
