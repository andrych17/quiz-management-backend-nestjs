/**
 * Standard API Response Interface
 * This interface defines the consistent response structure for all API endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  metadata?: ResponseMetadata;
  errors?: ValidationError[];
  timestamp: string;
  path?: string;
  statusCode: number;
}

export interface ResponseMetadata {
  pagination?: PaginationMetadata;
  total?: number;
  count?: number;
  filters?: Record<string, any>;
  duration?: number; // response time in milliseconds
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMetadata;
}

/**
 * Success Response Factory
 */
export class ResponseFactory {
  static success<T>(
    data: T,
    message: string = 'Operation successful',
    metadata?: ResponseMetadata,
    statusCode: number = 200
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      metadata,
      timestamp: new Date().toISOString(),
      statusCode,
    };
  }

  static error(
    message: string,
    errors?: ValidationError[],
    statusCode: number = 400,
    path?: string
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      statusCode,
      path,
    };
  }

  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Data retrieved successfully'
  ): ApiResponse<PaginatedResponse<T>> {
    const totalPages = Math.ceil(total / limit);
    
    const pagination: PaginationMetadata = {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    const data: PaginatedResponse<T> = {
      items,
      pagination,
    };

    return this.success(data, message, {
      pagination,
      total,
      count: items.length,
    });
  }
}