/**
 * Application Constants
 */

// App URLs
export const APP_URLS = {
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001/api',
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // Admin endpoints
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    STATS: '/admin/stats',
    USERS: '/admin/users',
    CONFIGS: '/admin/configs',
  },
  
  // Quiz endpoints
  QUIZ: {
    LIST: '/quizzes',
    CREATE: '/quizzes',
    GET: (id: number | string) => `/quizzes/${id}`,
    UPDATE: (id: number | string) => `/quizzes/${id}`,
    DELETE: (id: number | string) => `/quizzes/${id}`,
    DUPLICATE: (id: number | string) => `/quizzes/${id}/duplicate`,
    PUBLISH: (id: number | string) => `/quizzes/${id}/publish`,
    UNPUBLISH: (id: number | string) => `/quizzes/${id}/unpublish`,
  },
  
  // Question endpoints
  QUESTION: {
    CREATE: (quizId: number | string) => `/quizzes/${quizId}/questions`,
    UPDATE: (quizId: number | string, questionId: number | string) => `/quizzes/${quizId}/questions/${questionId}`,
    DELETE: (quizId: number | string, questionId: number | string) => `/quizzes/${quizId}/questions/${questionId}`,
    REORDER: (quizId: number | string) => `/quizzes/${quizId}/questions/reorder`,
  },
  
  // Public quiz endpoints
  PUBLIC: {
    QUIZ: (token: string) => `/public/quiz/${token}`,
    SUBMIT: (token: string) => `/public/quiz/${token}/submit`,
  },
  
  // Attempt endpoints
  ATTEMPT: {
    LIST: (quizId?: number | string) => quizId ? `/attempts?quizId=${quizId}` : '/attempts',
    GET: (id: number | string) => `/attempts/${id}`,
    EXPORT: (quizId: number | string) => `/attempts/export/${quizId}`,
  },
  
  // File upload endpoints
  UPLOAD: {
    QUIZ_IMAGE: (quizId: number | string) => `/upload/quiz/${quizId}/image`,
    DELETE_QUIZ_IMAGE: (quizId: number | string) => `/upload/quiz/${quizId}/image`,
  },
  
  // Location endpoints
  LOCATION: {
    LIST: '/locations',
    ASSIGN: (userId: number | string) => `/users/${userId}/location`,
    GET_USER_LOCATION: (userId: number | string) => `/users/${userId}/location`,
  },
} as const;

// Default values
export const DEFAULTS = {
  // Pagination
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // User settings
  USER_ROLE: 'user' as const,
  
  // Quiz settings
  QUIZ: {
    PASSING_SCORE: 70, // percentage
    QUESTIONS_PER_PAGE: 5,
    DEFAULT_EXPIRY_DAYS: 30,
  },
  
  // File upload settings
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    UPLOAD_PATH: 'uploads/',
    QUIZ_IMAGES_PATH: 'uploads/quiz-images/',
  },
  
  // Token settings
  TOKEN: {
    JWT_EXPIRES_IN: '24h',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    QUIZ_TOKEN_LENGTH: 12,
  },
  
  // Database settings
  DATABASE: {
    CONNECTION_TIMEOUT: 60000,
    QUERY_TIMEOUT: 30000,
  },
} as const;

// Status codes
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token has expired',
  FORBIDDEN: 'Access forbidden',
  
  // User errors
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USER_CREATION_FAILED: 'Failed to create user',
  
  // Validation
  VALIDATION_FAILED: 'Validation failed',
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `${field} has invalid format`,
  
  // Quiz errors
  QUIZ_NOT_FOUND: 'Quiz not found',
  QUIZ_EXPIRED: 'Quiz has expired',
  QUIZ_NOT_PUBLISHED: 'Quiz is not published',
  DUPLICATE_SUBMISSION: 'You have already submitted this quiz',
  
  // File upload errors
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
  
  // Database errors
  DATABASE_ERROR: 'Database operation failed',
  RECORD_NOT_FOUND: 'Record not found',
  DUPLICATE_ENTRY: 'Duplicate entry found',
  
  // Generic errors
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  // CRUD operations
  CREATED: (entity: string) => `${entity} created successfully`,
  UPDATED: (entity: string) => `${entity} updated successfully`,
  DELETED: (entity: string) => `${entity} deleted successfully`,
  
  // User operations
  USER_DELETED: 'User deleted successfully',
  
  // Quiz operations
  QUIZ_PUBLISHED: 'Quiz published successfully',
  QUIZ_UNPUBLISHED: 'Quiz unpublished successfully',
  QUIZ_DUPLICATED: 'Quiz duplicated successfully',
  QUIZ_SUBMITTED: 'Quiz submitted successfully',
  
  // File operations
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',
  
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  
  // Generic
  OPERATION_SUCCESS: 'Operation completed successfully',
} as const;

// Config groups for ConfigItem entity
export const CONFIG_GROUPS = {
  APP: 'app',
  QUIZ: 'quiz',
  LOCATION: 'location',
  EMAIL: 'email',
  SYSTEM: 'system',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin' as const,
  USER: 'user' as const,
} as const;

// Question types
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  MULTIPLE_SELECT: 'multiple-select',
  TEXT: 'text',
} as const;

// Service types for quiz
export const SERVICE_TYPES = {
  SERVICE_MANAGEMENT: 'service-management',
  NETWORK_MANAGEMENT: 'network-management',
  DATABASE_ADMIN: 'database-admin',
  SYSTEM_ADMIN: 'system-admin',
  WEB_DEVELOPMENT: 'web-development',
  MOBILE_DEVELOPMENT: 'mobile-development',
  DATA_SCIENCE: 'data-science',
  CYBERSECURITY: 'cybersecurity',
  CLOUD_COMPUTING: 'cloud-computing',
  DEVOPS: 'devops',
} as const;

// Quiz statuses
export const QUIZ_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
} as const;