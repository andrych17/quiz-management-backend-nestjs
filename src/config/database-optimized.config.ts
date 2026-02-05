import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Optimized database configuration for handling concurrent requests
 * Includes connection pooling and performance optimizations
 */
export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: !isProduction, // Never use in production
    logging: !isProduction,

    // Connection pool settings for high concurrency
    extra: {
      // Maximum number of clients in the pool
      // For hundreds of concurrent users, set this appropriately
      // Rule of thumb: (core count * 2) + number of disks
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),

      // Minimum number of clients in the pool
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),

      // Maximum time (in milliseconds) that a client can be idle before being closed
      idleTimeoutMillis: 30000,

      // Maximum time (in milliseconds) to wait for a connection from the pool
      connectionTimeoutMillis: 5000,

      // Number of retries if connection acquisition fails
      acquireTimeoutMillis: 10000,

      // Enable keep-alive to prevent connection drops
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,

      // Statement timeout (30 seconds)
      statement_timeout: 30000,

      // Query timeout
      query_timeout: 30000,

      // Application name for monitoring
      application_name: 'quiz-backend',
    },

    // Retry connection attempts
    retryAttempts: 3,
    retryDelay: 3000,

    // Cache settings for improved performance
    cache: {
      duration: 30000, // 30 seconds cache
      type: 'database',
      tableName: 'query_result_cache',
    },
  };
};

/**
 * Database performance recommendations:
 * 
 * 1. Connection Pooling:
 *    - Set DB_POOL_MAX based on your server specs: (CPU cores * 2) + disk count
 *    - For 4-core server with 1 disk: 10 connections
 *    - For 8-core server with 2 disks: 18-20 connections
 * 
 * 2. Indexes:
 *    - Ensure indexes on frequently queried columns:
 *      - attempts.email
 *      - attempts.nij
 *      - attempts.quiz_id
 *      - attempts.submitted_at
 * 
 * 3. Database Tuning (PostgreSQL):
 *    - max_connections: Should be higher than pool max (e.g., 100)
 *    - shared_buffers: 25% of system RAM
 *    - effective_cache_size: 50-75% of system RAM
 *    - work_mem: (Total RAM / max_connections) / 2
 *    - maintenance_work_mem: 512MB - 2GB
 *    - checkpoint_completion_target: 0.9
 *    - wal_buffers: 16MB
 *    - default_statistics_target: 100
 *    - random_page_cost: 1.1 (for SSD)
 * 
 * 4. Monitoring:
 *    - Monitor connection pool usage
 *    - Track slow queries
 *    - Watch for connection leaks
 *    - Monitor transaction deadlocks
 */
