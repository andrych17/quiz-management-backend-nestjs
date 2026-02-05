import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * In-memory rate limiter - perfect for single-instance Render deployments
 * 
 * Memory usage: ~100 bytes per unique IP
 * With 1000 unique IPs per hour: ~100KB memory
 * 
 * NOTE: For multi-instance deployments, use Redis-based solution like @nestjs/throttler
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxRequests: number = 100, windowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const identifier = this.getIdentifier(req);
    const now = Date.now();

    let entry = this.rateLimitMap.get(identifier);

    // Create new entry if doesn't exist or expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
      };
      this.rateLimitMap.set(identifier, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, this.maxRequests - entry.count).toString(),
    );
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(entry.resetTime).toISOString(),
    );

    if (entry.count > this.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests. Please try again later.',
        retryAfter,
      });
    }

    next();
  }

  private getIdentifier(req: Request): string {
    // Use IP address and endpoint as identifier
    const ip =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      'unknown';
    return `${ip}:${req.path}`;
  }

  private cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`[RateLimit] Cleaned up ${removed} expired entries. Active IPs: ${this.rateLimitMap.size}`);
    }
  }

  destroy() {
    // Clean up interval when middleware is destroyed
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Factory functions for different rate limit levels
 * Adjusted for realistic Render single-instance capacity
 */
export function createStrictRateLimit(): RateLimitMiddleware {
  return new RateLimitMiddleware(20, 1); // 20 requests per minute per IP
}

export function createModerateRateLimit(): RateLimitMiddleware {
  return new RateLimitMiddleware(60, 1); // 60 requests per minute per IP
}

export function createLenientRateLimit(): RateLimitMiddleware {
  return new RateLimitMiddleware(120, 1); // 120 requests per minute per IP (good for quiz submissions)
}
